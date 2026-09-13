# CineBook

CineBook is a full-stack movie ticket booking system built as a college project. Users can register, browse movies, choose a theatre show and seats, complete a simulated payment step, and manage their bookings. An admin panel manages the movies, theatres, screens, and shows available in the system.

## Features

- User registration and login
- Movie browsing with show and theatre details
- Database-backed seat availability and seat selection
- Ticket booking and booking cancellation
- My Bookings page
- Simulated payment flow at ₹150 per seat
- Admin management for movies, theatres, screens, and shows
- Automatic seat generation when a show is created
- Admin deletion of supported records with dependency checks

## Tech Stack

| Technology | Purpose |
| --- | --- |
| Node.js and Express.js | Backend server, routing, validation, and static file serving |
| MySQL | Persistent application data and booking records |
| HTML, CSS, JavaScript | Frontend pages, styling, API requests, and interactions |
| `mysql` | MySQL connection from Node.js |
| `dotenv` | Environment configuration |
| `cors` | Express CORS middleware |

## How It Works

```text
User -> Frontend -> Express.js Backend -> MySQL Database
```

The frontend in `public/` calls the Express backend with `fetch()`. The backend reads and updates MySQL records for users, movies, theatres, screens, shows, seats, and bookings. Booking uses a database transaction to check seat availability, create booking records, and mark selected seats as booked.

### User Flow

Register/Login -> Browse Movies -> Select Show -> Select Seats -> Book -> Simulated Payment -> My Bookings

### Admin Flow

The admin logs in, receives a token, and uses the admin panel to view or add movies, theatres, screens, and shows. Creating a show also generates seats from the selected screen capacity. Existing shows, screens, or bookings are checked before supported records are deleted.

## Database Design

`cinebook.sql` creates the following tables:

- `Users` - registered users
- `Movies` - movie name, genre, duration, and image URL
- `Theatres` - theatre names and locations
- `Screens` - theatre screens and capacities
- `Shows` - movie, screen, date, and time information
- `ShowSeats` - generated seats and their availability status
- `Bookings` - user, show, seat, and booking date records

The logical relationships are `Theatres -> Screens`, `Movies + Screens -> Shows`, `Shows -> ShowSeats`, and `Users + Shows + ShowSeats -> Bookings`. The current SQL uses ID columns but does not declare foreign-key constraints.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/register`, `/login`, `/admin-login` | User and admin authentication |
| `GET` | `/movies`, `/shows/:movie_id`, `/seats/:show_id` | Browse movies, shows, and seats |
| `POST` | `/book`, `/cancel` | Create or cancel bookings |
| `GET` | `/mybookings/:user_id` | List a user's bookings |
| `GET` | `/admin/movies`, `/admin/theatres`, `/admin/screens`, `/admin/shows` | View admin records |
| `POST` | `/add-movie`, `/add-theatre`, `/add-screen`, `/add-show` | Add admin records |
| `DELETE` | `/delete-movie/:id`, `/delete-theatre/:id`, `/delete-screen/:id`, `/delete-show/:id` | Delete supported admin records |

Admin endpoints require the token returned by `/admin-login` in the `Authorization: Bearer <token>` header.

## Project Structure

```text
CineBook/
├── public/          # HTML pages, CSS, and browser JavaScript
├── server.js        # Express server and API routes
├── db.js            # MySQL connection
├── cinebook.sql     # Database setup
├── package.json     # Scripts and dependencies
├── package-lock.json
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js and npm
- Local MySQL server

```bash
git clone https://github.com/saliha711/CineBook.git
cd CineBook
npm install
```

Create a local `.env` file:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=cinebook
DB_PORT=3306
PORT=3000
ADMIN_PASSWORD=choose_an_admin_password
```

Set up the database and start the server:

```bash
mysql -u root -p < cinebook.sql
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What I Learned

- Building REST-style Express routes and connecting a frontend to a MySQL database
- Designing related tables for movies, shows, seats, and bookings
- Using transactions to keep seat availability and booking records consistent
- Managing frontend state and page navigation with browser `localStorage`
- Implementing role-specific admin operations and request validation

## Future Improvements

- Add password hashing with `bcrypt`
- Use secure sessions or `httpOnly` cookies for authentication
- Integrate a real payment gateway
- Add stronger database constraints, automated tests, and deployment configuration

## Author

Saliha S A  \
B.Tech Computer Science & Design  \
FISAT

## GitHub

[CineBook repository](https://github.com/saliha711/CineBook)
