require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sendError(res, status, message) {
    return res.status(status).json({ error: message || 'Something went wrong.' });
}

function isValidNumber(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token || token !== ADMIN_TOKEN) {
        return sendError(res, 401, 'Unauthorized admin access.');
    }

    next();
}

// -------- AUTH --------
app.post('/register', (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();

    if (!username || !password) {
        return sendError(res, 400, 'Username and password are required.');
    }

    if (password.length < 6) {
        return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    db.query('SELECT user_id FROM Users WHERE username=?', [username], (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to register right now.');
        }

        if (result.length > 0) {
            return sendError(res, 409, 'Username already exists.');
        }

        db.query('INSERT INTO Users(username, password) VALUES (?, ?)', [username, password], (insertErr) => {
            if (insertErr) {
                return sendError(res, 500, 'Error registering user.');
            }

            res.status(201).json({ message: 'Registered Successfully' });
        });
    });
});

app.post('/login', (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();

    if (!username || !password) {
        return sendError(res, 400, 'Username and password are required.');
    }

    db.query('SELECT user_id, username FROM Users WHERE username=? AND password=?', [username, password], (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to login right now.');
        }

        if (result.length === 0) {
            return sendError(res, 401, 'Invalid credentials.');
        }

        res.json({ user_id: result[0].user_id, username: result[0].username });
    });
});

app.post('/admin-login', (req, res) => {
    const password = String(req.body.password || '').trim();

    if (!password) {
        return sendError(res, 400, 'Admin password is required.');
    }

    if (password !== ADMIN_PASSWORD) {
        return sendError(res, 401, 'Invalid admin password.');
    }

    res.json({
        token: ADMIN_TOKEN,
        message: 'Admin login successful.'
    });
});

// -------- MOVIES --------
app.get('/movies', (req, res) => {
    db.query('SELECT * FROM Movies ORDER BY movie_id DESC', (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load movies right now.');
        }

        res.json(result);
    });
});

// -------- SHOWS --------
app.get('/shows/:movie_id', (req, res) => {
    const movieId = Number(req.params.movie_id);

    if (!isValidNumber(movieId)) {
        return sendError(res, 400, 'Movie information is missing.');
    }

    db.query(`SELECT Shows.*, Theatres.theatre_name
        FROM Shows
        JOIN Screens ON Shows.screen_id = Screens.screen_id
        JOIN Theatres ON Screens.theatre_id = Theatres.theatre_id
        WHERE Shows.movie_id=?
        ORDER BY Shows.show_date, Shows.show_time`, [movieId], (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load shows for this movie.');
        }

        res.json(result);
    });
});

// -------- SEATS --------
app.get('/seats/:show_id', (req, res) => {
    const showId = Number(req.params.show_id);

    if (!isValidNumber(showId)) {
        return sendError(res, 400, 'Show information is missing.');
    }

    db.query('SELECT * FROM ShowSeats WHERE show_id=? ORDER BY seat_number', [showId], (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load seats for this show.');
        }

        res.json(result);
    });
});

// -------- BOOK --------
app.post('/book', (req, res) => {
    const { user_id, show_id, seats } = req.body;

    if (!isValidNumber(user_id) || !isValidNumber(show_id)) {
        return sendError(res, 400, 'A valid user and show are required.');
    }

    if (!Array.isArray(seats) || seats.length === 0) {
        return sendError(res, 400, 'Please select at least one seat.');
    }

    const uniqueSeatIds = [...new Set(seats.map(Number).filter(Boolean))];

    if (uniqueSeatIds.length !== seats.length) {
        return sendError(res, 400, 'One or more selected seats are invalid.');
    }

    db.beginTransaction((beginErr) => {
        if (beginErr) {
            return sendError(res, 500, 'Unable to process booking right now.');
        }

        const seatChecks = uniqueSeatIds.map((seatId) => new Promise((resolve, reject) => {
            db.query('SELECT show_seat_id, status FROM ShowSeats WHERE show_seat_id=? AND show_id=?', [seatId, show_id], (err, rows) => {
                if (err) {
                    return reject(new Error('Database error while checking availability.'));
                }

                if (!rows.length) {
                    return reject(new Error('One or more selected seats are not available for this show.'));
                }

                if (rows[0].status !== 'Available') {
                    return reject(new Error('One or more selected seats are already booked.'));
                }

                resolve();
            });
        }));

        Promise.all(seatChecks)
            .then(() => {
                const bookingValues = uniqueSeatIds.map((seatId) => [user_id, show_id, seatId, new Date()]);

                db.query('INSERT INTO Bookings(user_id, show_id, show_seat_id, booking_date) VALUES ?', [bookingValues], (insertErr) => {
                    if (insertErr) {
                        return db.rollback(() => sendError(res, 500, 'Booking failed while saving your seats.'));
                    }

                    db.query('UPDATE ShowSeats SET status="Booked" WHERE show_seat_id IN (?)', [uniqueSeatIds], (updateErr) => {
                        if (updateErr) {
                            return db.rollback(() => sendError(res, 500, 'Booking failed while updating seat status.'));
                        }

                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => sendError(res, 500, 'Booking could not be completed.'));
                            }

                            res.json({ message: 'Booking Successful' });
                        });
                    });
                });
            })
            .catch((error) => {
                db.rollback(() => sendError(res, 400, error.message || 'One or more selected seats are already booked.'));
            });
    });
});

// -------- CANCEL --------
app.post('/cancel', (req, res) => {
    const bookingIds = Array.isArray(req.body.booking_ids) ? req.body.booking_ids.map(Number).filter(Boolean) : [];

    if (bookingIds.length === 0) {
        return sendError(res, 400, 'Please select at least one booking to cancel.');
    }

    db.beginTransaction((beginErr) => {
        if (beginErr) {
            return sendError(res, 500, 'Unable to cancel booking right now.');
        }

        db.query('SELECT show_seat_id FROM Bookings WHERE booking_id IN (?)', [bookingIds], (selectErr, rows) => {
            if (selectErr) {
                return db.rollback(() => sendError(res, 500, 'Unable to find bookings to cancel.'));
            }

            if (!rows.length) {
                return db.rollback(() => sendError(res, 404, 'No valid bookings found to cancel.'));
            }

            const seatIds = rows.map(row => row.show_seat_id);

            db.query('UPDATE ShowSeats SET status="Available" WHERE show_seat_id IN (?)', [seatIds], (updateErr) => {
                if (updateErr) {
                    return db.rollback(() => sendError(res, 500, 'Unable to update seat availability.'));
                }

                db.query('DELETE FROM Bookings WHERE booking_id IN (?)', [bookingIds], (deleteErr) => {
                    if (deleteErr) {
                        return db.rollback(() => sendError(res, 500, 'Unable to cancel the selected bookings.'));
                    }

                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => sendError(res, 500, 'Cancellation could not be completed.'));
                        }

                        res.json({ message: 'Cancelled Successfully' });
                    });
                });
            });
        });
    });
});

// -------- ADMIN --------
app.get('/admin/movies', verifyAdmin, (req, res) => {
    db.query('SELECT * FROM Movies ORDER BY movie_id DESC', (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load movies.');
        }

        res.json(result);
    });
});

app.get('/admin/theatres', verifyAdmin, (req, res) => {
    db.query('SELECT * FROM Theatres ORDER BY theatre_id DESC', (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load theatres.');
        }

        res.json(result);
    });
});

app.get('/admin/screens', verifyAdmin, (req, res) => {
    db.query(`SELECT Screens.*, Theatres.theatre_name
        FROM Screens
        JOIN Theatres ON Screens.theatre_id = Theatres.theatre_id
        ORDER BY Screens.screen_id DESC`, (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load screens.');
        }

        res.json(result);
    });
});

app.get('/admin/shows', verifyAdmin, (req, res) => {
    db.query(`SELECT Shows.*, Movies.movie_name, Theatres.theatre_name
        FROM Shows
        JOIN Movies ON Shows.movie_id = Movies.movie_id
        JOIN Screens ON Shows.screen_id = Screens.screen_id
        JOIN Theatres ON Screens.theatre_id = Theatres.theatre_id
        ORDER BY Shows.show_id DESC`, (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load shows.');
        }

        res.json(result);
    });
});

app.post('/add-movie', verifyAdmin, (req, res) => {
    const name = String(req.body.name || '').trim();
    const genre = String(req.body.genre || '').trim();
    const duration = String(req.body.duration || '').trim();
    const image_url = String(req.body.image_url || '').trim();

    if (!name || !genre || !duration) {
        return sendError(res, 400, 'Movie name, genre and duration are required.');
    }

    db.query('INSERT INTO Movies(movie_name, genre, duration, image_url) VALUES (?,?,?,?)', [name, genre, duration, image_url], (err) => {
        if (err) {
            return sendError(res, 500, 'Unable to add movie.');
        }

        res.json({ message: 'Movie Added' });
    });
});

app.post('/add-theatre', verifyAdmin, (req, res) => {
    const name = String(req.body.name || '').trim();
    const location = String(req.body.location || '').trim();

    if (!name || !location) {
        return sendError(res, 400, 'Theatre name and location are required.');
    }

    db.query('INSERT INTO Theatres(theatre_name, location) VALUES (?,?)', [name, location], (err) => {
        if (err) {
            return sendError(res, 500, 'Unable to add theatre.');
        }

        res.json({ message: 'Theatre Added' });
    });
});

app.post('/add-screen', verifyAdmin, (req, res) => {
    const theatre_id = Number(req.body.theatre_id);
    const capacity = Number(req.body.capacity);

    if (!isValidNumber(theatre_id) || !isValidNumber(capacity)) {
        return sendError(res, 400, 'Valid theatre ID and capacity are required.');
    }

    db.query('INSERT INTO Screens(theatre_id, capacity) VALUES (?,?)', [theatre_id, capacity], (err) => {
        if (err) {
            return sendError(res, 500, 'Unable to add screen.');
        }

        res.json({ message: 'Screen Added' });
    });
});

app.post('/add-show', verifyAdmin, (req, res) => {
    const movie_id = Number(req.body.movie_id);
    const screen_id = Number(req.body.screen_id);
    const show_time = String(req.body.show_time || '').trim();
    const show_date = String(req.body.show_date || '').trim();

    if (!isValidNumber(movie_id) || !isValidNumber(screen_id) || !show_time || !show_date) {
        return sendError(res, 400, 'Movie, screen, date and time are required.');
    }

    db.query('INSERT INTO Shows(movie_id, screen_id, show_time, show_date) VALUES (?,?,?,?)', [movie_id, screen_id, show_time, show_date], (insertErr, result) => {
        if (insertErr) {
            return sendError(res, 500, 'Unable to create show.');
        }

        const showId = result.insertId;

        db.query('SELECT capacity FROM Screens WHERE screen_id=?', [screen_id], (screenErr, screenRows) => {
            if (screenErr || !screenRows.length) {
                return sendError(res, 500, 'Unable to generate seats for this show.');
            }

            const capacity = Number(screenRows[0].capacity);
            const seats = [];
            let rowIndex = 0;
            let seatNumber = 1;

            while (seatNumber <= capacity) {
                const rowLetter = String.fromCharCode(65 + rowIndex);

                for (let col = 1; col <= 10 && seatNumber <= capacity; col++) {
                    seats.push([showId, rowLetter + col, 'Available']);
                    seatNumber += 1;
                }
                rowIndex += 1;
            }

            db.query('INSERT INTO ShowSeats(show_id, seat_number, status) VALUES ?', [seats], (seatErr) => {
                if (seatErr) {
                    return sendError(res, 500, 'Show was added, but seat generation failed.');
                }

                res.json({ message: 'Show Added with Seats' });
            });
        });
    });
});

app.delete('/delete-show/:id', verifyAdmin, (req, res) => {
    const showId = Number(req.params.id);

    if (!isValidNumber(showId)) {
        return sendError(res, 400, 'Invalid show ID.');
    }

    db.beginTransaction((beginErr) => {
        if (beginErr) {
            return sendError(res, 500, 'Unable to delete show.');
        }

        db.query('DELETE FROM Bookings WHERE show_id=?', [showId], (bookingErr) => {
            if (bookingErr) {
                return db.rollback(() => sendError(res, 500, 'Unable to remove bookings for this show.'));
            }

            db.query('DELETE FROM ShowSeats WHERE show_id=?', [showId], (seatErr) => {
                if (seatErr) {
                    return db.rollback(() => sendError(res, 500, 'Unable to remove seats for this show.'));
                }

                db.query('DELETE FROM Shows WHERE show_id=?', [showId], (showErr) => {
                    if (showErr) {
                        return db.rollback(() => sendError(res, 500, 'Unable to delete this show.'));
                    }

                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => sendError(res, 500, 'Deleting the show could not be completed.'));
                        }

                        res.json({ message: 'Show deleted successfully.' });
                    });
                });
            });
        });
    });
});

app.delete('/delete-movie/:id', verifyAdmin, (req, res) => {
    const movieId = Number(req.params.id);

    if (!isValidNumber(movieId)) {
        return sendError(res, 400, 'Invalid movie ID.');
    }

    db.query('SELECT COUNT(*) AS showCount FROM Shows WHERE movie_id=?', [movieId], (countErr, rows) => {
        if (countErr) {
            return sendError(res, 500, 'Unable to check movie usage.');
        }

        if (Number(rows[0].showCount) > 0) {
            return sendError(res, 400, 'This movie cannot be deleted because it has existing shows/bookings.');
        }

        db.query('DELETE FROM Movies WHERE movie_id=?', [movieId], (err) => {
            if (err) {
                return sendError(res, 500, 'Unable to delete this movie.');
            }

            res.json({ message: 'Movie deleted successfully.' });
        });
    });
});

app.delete('/delete-theatre/:id', verifyAdmin, (req, res) => {
    const theatreId = Number(req.params.id);

    if (!isValidNumber(theatreId)) {
        return sendError(res, 400, 'Invalid theatre ID.');
    }

    db.query('SELECT COUNT(*) AS screenCount FROM Screens WHERE theatre_id=?', [theatreId], (countErr, rows) => {
        if (countErr) {
            return sendError(res, 500, 'Unable to check theatre usage.');
        }

        if (Number(rows[0].screenCount) > 0) {
            return sendError(res, 400, 'This theatre cannot be deleted because it has screens attached to it.');
        }

        db.query('DELETE FROM Theatres WHERE theatre_id=?', [theatreId], (err) => {
            if (err) {
                return sendError(res, 500, 'Unable to delete this theatre.');
            }

            res.json({ message: 'Theatre deleted successfully.' });
        });
    });
});

app.delete('/delete-screen/:id', verifyAdmin, (req, res) => {
    const screenId = Number(req.params.id);

    if (!isValidNumber(screenId)) {
        return sendError(res, 400, 'Invalid screen ID.');
    }

    db.query('SELECT COUNT(*) AS showCount FROM Shows WHERE screen_id=?', [screenId], (countErr, rows) => {
        if (countErr) {
            return sendError(res, 500, 'Unable to check screen usage.');
        }

        if (Number(rows[0].showCount) > 0) {
            return sendError(res, 400, 'This screen cannot be deleted because it has existing shows.');
        }

        db.query('DELETE FROM Screens WHERE screen_id=?', [screenId], (err) => {
            if (err) {
                return sendError(res, 500, 'Unable to delete this screen.');
            }

            res.json({ message: 'Screen deleted successfully.' });
        });
    });
});

app.get('/mybookings/:user_id', (req, res) => {
    const userId = Number(req.params.user_id);

    if (!isValidNumber(userId)) {
        return sendError(res, 400, 'User information is missing.');
    }

    db.query(`SELECT Bookings.booking_id, ShowSeats.seat_number, Movies.movie_name
        FROM Bookings
        JOIN ShowSeats ON Bookings.show_seat_id = ShowSeats.show_seat_id
        JOIN Shows ON Bookings.show_id = Shows.show_id
        JOIN Movies ON Shows.movie_id = Movies.movie_id
        WHERE Bookings.user_id=?
        ORDER BY Bookings.booking_id DESC`, [userId], (err, result) => {
        if (err) {
            return sendError(res, 500, 'Unable to load your bookings.');
        }

        res.json(result);
    });
});

app.use((req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/movies') || req.path.startsWith('/shows') || req.path.startsWith('/seats') || req.path.startsWith('/book') || req.path.startsWith('/cancel') || req.path.startsWith('/mybookings') || req.path.startsWith('/register') || req.path.startsWith('/login')) {
        return res.status(404).json({ error: 'Route not found.' });
    }

    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
