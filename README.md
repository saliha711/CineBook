# CineBook

**CineBook** is a full-stack movie ticket booking system built with **Node.js, Express.js, MySQL, HTML, CSS, and JavaScript**.

It provides an end-to-end booking workflow where users can register, browse movies, select shows and seats, complete a simulated payment, and manage their bookings. An admin dashboard provides management of movies, theatres, screens, and shows.

## Features

### User

* User registration and login
* Browse available movies with genre, duration, and poster
* View shows by movie, theatre, date, and time
* Real-time seat availability from the database
* Select multiple seats and create bookings
* Simulated payment flow
* View previous bookings
* Cancel bookings and release seats

### Admin

* Protected admin authentication
* View movies, theatres, screens, and shows
* Add movies, theatres, screens, and shows
* Delete movies, theatres, screens, and shows
* Automatic seat generation when creating a show
* Validation to prevent deletion when records are still in use

## Tech Stack

| Technology       | Purpose                                     |
| ---------------- | ------------------------------------------- |
| **Node.js**      | Backend runtime                             |
| **Express.js**   | REST API and server                         |
| **MySQL**        | Relational database                         |
| **JavaScript**   | Frontend interactions and API communication |
| **HTML & CSS**   | User interface                              |
| **mysql**        | MySQL connectivity                          |
| **dotenv**       | Environment configuration                   |
| **Git & GitHub** | Version control                             |

## Architecture

```text
              ┌─────────────────────┐
              │      Browser        │
              │  HTML / CSS / JS    │
              └──────────┬──────────┘
                         │
                    REST API
                         │
              ┌──────────▼──────────┐
              │   Express.js        │
              │      Backend        │
              └──────────┬──────────┘
                         │
                    SQL Queries
                         │
              ┌──────────▼──────────┐
              │       MySQL         │
              │      Database       │
              └─────────────────────┘
```

The frontend communicates with the Express backend using `fetch()` requests. The backend handles authentication, movie/show management, seat availability, bookings, cancellations, and database operations.

## Database Design

CineBook uses a relational MySQL database with the following main entities:

```text
Users
  │
  └── Bookings ── ShowSeats ── Shows
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Movies              Screens
                                        │
                                    Theatres
```

### Main Tables

* **Users** — stores registered users
* **Movies** — movie information
* **Theatres** — theatre details
* **Screens** — screens and their capacities
* **Shows** — movie screenings with date and time
* **ShowSeats** — seat availability for each show
* **Bookings** — user seat bookings and booking timestamps

The complete database schema and sample data are available in [`cinebook.sql`](cinebook.sql).

## Key API Endpoints

| Method   | Endpoint               | Purpose                          |
| -------- | ---------------------- | -------------------------------- |
| `POST`   | `/register`            | Register a user                  |
| `POST`   | `/login`               | Authenticate a user              |
| `GET`    | `/movies`              | Retrieve movies                  |
| `GET`    | `/shows/:movie_id`     | Retrieve shows for a movie       |
| `GET`    | `/seats/:show_id`      | Retrieve seat availability       |
| `POST`   | `/book`                | Create a booking                 |
| `POST`   | `/cancel`              | Cancel bookings                  |
| `GET`    | `/mybookings/:user_id` | Retrieve user bookings           |
| `POST`   | `/admin-login`         | Authenticate admin               |
| `POST`   | `/add-movie`           | Add a movie                      |
| `POST`   | `/add-theatre`         | Add a theatre                    |
| `POST`   | `/add-screen`          | Add a screen                     |
| `POST`   | `/add-show`            | Create a show and generate seats |
| `DELETE` | `/delete-movie/:id`    | Delete a movie                   |
| `DELETE` | `/delete-theatre/:id`  | Delete a theatre                 |
| `DELETE` | `/delete-screen/:id`   | Delete a screen                  |
| `DELETE` | `/delete-show/:id`     | Delete a show                    |

## Project Structure

```text
CineBook/
│
├── public/
│   ├── admin.html
│   ├── booking.html
│   ├── login.html
│   ├── movies.html
│   ├── mybookings.html
│   ├── payment.html
│   ├── shows.html
│   └── style.css
│
├── cinebook.sql
├── db.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── .env
```

## Getting Started

### Prerequisites

Make sure you have:

* [Node.js](https://nodejs.org/) and npm
* MySQL Server
* Git

### 1. Clone the repository

```bash
git clone https://github.com/saliha711/CineBook.git
cd CineBook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cinebook
DB_PORT=3306
PORT=3000
ADMIN_PASSWORD=your_admin_password
```

### 4. Set up the database

Create the database and tables using:

```bash
mysql -u root -p < cinebook.sql
```

Alternatively, import `cinebook.sql` using MySQL Workbench.

### 5. Start the application

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Booking Flow

```text
Login
  ↓
Browse Movies
  ↓
Select Movie
  ↓
Choose Show
  ↓
Select Available Seats
  ↓
Create Booking
  ↓
Simulated Payment
  ↓
View My Bookings
```

When a booking is created, the selected seats are marked as **Booked** in the database. When a booking is cancelled, the associated seats are released back to **Available**.

## What I Learned

Building CineBook involved working with:

* REST API design using Express.js
* Relational database design and SQL queries
* Connecting a Node.js backend with MySQL
* Frontend-to-backend communication using REST APIs
* Managing relationships between movies, shows, screens, seats, and bookings
* Handling seat availability and booking state
* Implementing CRUD operations
* Authentication and protected admin operations
* Environment-based configuration
* Git and GitHub version control

## Future Improvements

* Password hashing with bcrypt
* More robust user authentication and session management
* Real payment gateway integration
* Automated testing
* Production deployment
* Improved seat-locking for concurrent bookings

> CineBook is an academic project. Payment is simulated, and authentication is designed for the project's development environment rather than production use.

## Author

**Saliha S A**

B.Tech Computer Science & Design
Federal Institute of Science and Technology (FISAT)

## Repository

[GitHub — CineBook](https://github.com/saliha711/CineBook)
