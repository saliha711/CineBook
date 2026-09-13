CREATE DATABASE cinebook;
USE cinebook;

CREATE TABLE Users(user_id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), password VARCHAR(50));
CREATE TABLE Movies(movie_id INT AUTO_INCREMENT PRIMARY KEY, movie_name VARCHAR(100), genre VARCHAR(50), duration VARCHAR(20));
CREATE TABLE Theatres(theatre_id INT AUTO_INCREMENT PRIMARY KEY, theatre_name VARCHAR(100), location VARCHAR(100));
CREATE TABLE Screens(screen_id INT AUTO_INCREMENT PRIMARY KEY, theatre_id INT, capacity INT);
CREATE TABLE Shows(show_id INT AUTO_INCREMENT PRIMARY KEY, movie_id INT, screen_id INT, show_time VARCHAR(20), show_date DATE);
CREATE TABLE ShowSeats(show_seat_id INT AUTO_INCREMENT PRIMARY KEY, show_id INT, seat_number VARCHAR(10), status VARCHAR(20));
CREATE TABLE Bookings(booking_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, show_id INT, show_seat_id INT, booking_date DATETIME);

ALTER TABLE Users ADD UNIQUE (username);

use cinebook;
truncate table bookings;
DELETE FROM Shows;
delete from movies;

select * from movies;
ALTER TABLE Movies ADD image_url TEXT;

UPDATE Movies 
SET movie_name = 'Project Hail Mary' 
WHERE movie_id = 2;

