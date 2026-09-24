-- =====================================================================
-- CINEMAMAX — Full Database (matches the frontend demo in data.js)
-- ---------------------------------------------------------------------
-- Open in MySQL Workbench (or run: mysql -u root < cinemamax_full.sql)
-- Works on both MySQL 8 and MariaDB (compatible syntax).
-- Re-runnable: it drops and recreates every table below.
-- =====================================================================

DROP DATABASE IF EXISTS cinemamax_full;
CREATE DATABASE cinemamax_full CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinemamax_full;

-- =====================================================================
-- 1. USERS
-- =====================================================================
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    phone         VARCHAR(20)         NULL,
    role          VARCHAR(10)         NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255)        NOT NULL,
    avatar        VARCHAR(5)          NULL,
    created_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 2. CINEMAS
-- =====================================================================
CREATE TABLE cinemas (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(120)        NOT NULL,
    location      VARCHAR(80)         NOT NULL,
    address       VARCHAR(255)        NULL,
    phone         VARCHAR(30)         NULL,
    email         VARCHAR(150)        NULL,
    opening_hours VARCHAR(80)         NULL,
    image         VARCHAR(500)        NULL,
    features      VARCHAR(255)        NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 3. HALLS
-- =====================================================================
CREATE TABLE halls (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cinema_id   INT             NOT NULL,
    name        VARCHAR(50)     NOT NULL,
    hall_type   VARCHAR(30)     NULL,
    capacity    INT             NOT NULL DEFAULT 96,
    layout      VARCHAR(20)     NULL,
    amenities   VARCHAR(255)    NULL,
    image       VARCHAR(500)    NULL,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. SEATS (every hall gets rows A-H, seats 1-12)
--    row types: A-C standard | D-E premium | F-G vip | H couple
-- =====================================================================
CREATE TABLE seats (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    hall_id       INT             NOT NULL,
    seat_row      CHAR(1)         NOT NULL,
    seat_number   INT             NOT NULL,
    seat_type     VARCHAR(15)     NOT NULL,
    is_wheelchair TINYINT(1)      NOT NULL DEFAULT 0,
    UNIQUE KEY uniq_hall_seat (hall_id, seat_row, seat_number),
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Global price per seat type (from APP_DATA.seatLayout.prices)
CREATE TABLE seat_pricing (
    seat_type VARCHAR(15) PRIMARY KEY,
    price     DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 5. MOVIES (+ many-to-many join tables)
-- =====================================================================
CREATE TABLE movies (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200)    NOT NULL,
    description  TEXT            NULL,
    director     VARCHAR(100)    NULL,
    duration_min INT             NULL,
    rating       DECIMAL(3,1)    NULL,
    language     VARCHAR(60)     NULL,
    release_date DATE            NULL,
    status       VARCHAR(20)     NOT NULL DEFAULT 'now_showing',
    poster_url   VARCHAR(500)    NULL,
    trailer_id   VARCHAR(50)     NULL,
    base_price   DECIMAL(10,2)   NULL,
    popularity   INT             NULL DEFAULT 0,
    featured     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE movies_genres (
    movie_id INT         NOT NULL,
    genre    VARCHAR(50) NOT NULL,
    PRIMARY KEY (movie_id, genre),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE movies_subtitles (
    movie_id  INT         NOT NULL,
    subtitle  VARCHAR(50) NOT NULL,
    PRIMARY KEY (movie_id, subtitle),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE movies_formats (
    movie_id INT         NOT NULL,
    format   VARCHAR(20) NOT NULL,
    PRIMARY KEY (movie_id, format),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE movies_cast (
    movie_id  INT         NOT NULL,
    cast_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (movie_id, cast_name),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 6. SHOWTIMES
-- =====================================================================
CREATE TABLE showtimes (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    movie_id  INT        NOT NULL,
    hall_id   INT        NOT NULL,
    show_date DATE       NOT NULL,
    show_time TIME       NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (hall_id)  REFERENCES halls(id)  ON DELETE CASCADE,
    UNIQUE KEY uniq_show (movie_id, hall_id, show_date, show_time)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. SHOWTIME SEATS (live seat map: available / locked / booked)
-- =====================================================================
CREATE TABLE showtime_seats (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id  INT          NOT NULL,
    seat_id      INT          NOT NULL,
    status       VARCHAR(15)  NOT NULL DEFAULT 'available',
    locked_until DATETIME     NULL,
    UNIQUE KEY uniq_show_seat (showtime_id, seat_id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id)     REFERENCES seats(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. BOOKINGS
-- =====================================================================
CREATE TABLE bookings (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref      VARCHAR(20)      NOT NULL UNIQUE,
    user_id          INT              NOT NULL,
    showtime_id      INT              NOT NULL,
    seats_summary    VARCHAR(60)      NOT NULL,
    ticket_count     INT              NOT NULL,
    total_amount     DECIMAL(10,2)    NOT NULL,
    convenience_fee  DECIMAL(10,2)    NOT NULL DEFAULT 0,
    status           VARCHAR(15)      NOT NULL DEFAULT 'pending',
    payment_method   VARCHAR(20)      NULL,
    booking_date     DATE             NOT NULL,
    created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE booking_seats (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    booking_id       INT          NOT NULL,
    showtime_seat_id INT          NOT NULL,
    seat_type        VARCHAR(15)  NOT NULL,
    price            DECIMAL(10,2) NOT NULL,
    UNIQUE KEY uniq_booking_seat (booking_id, showtime_seat_id),
    FOREIGN KEY (booking_id)       REFERENCES bookings(id)        ON DELETE CASCADE,
    FOREIGN KEY (showtime_seat_id) REFERENCES showtime_seats(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 9. PAYMENTS (one row per confirmed booking)
-- =====================================================================
CREATE TABLE payments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    booking_id     INT              NOT NULL,
    amount         DECIMAL(10,2)    NOT NULL,
    payment_method VARCHAR(20)      NOT NULL DEFAULT 'card',
    transaction_id VARCHAR(100)     NULL,
    status         VARCHAR(15)      NOT NULL DEFAULT 'pending',
    paid_at        DATETIME         NULL,
    created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 10. OFFERS / NOTIFICATIONS / WATCHLIST
-- =====================================================================
CREATE TABLE offers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(120)    NOT NULL,
    description TEXT            NULL,
    discount    INT             NOT NULL DEFAULT 0,
    code        VARCHAR(30)     NULL,
    valid_from  DATE            NULL,
    valid_to    DATE            NULL,
    offer_type  VARCHAR(20)     NULL,
    icon        VARCHAR(10)     NULL,
    color       VARCHAR(20)     NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    title       VARCHAR(120) NOT NULL,
    message     TEXT         NULL,
    time_label  VARCHAR(30)  NULL,
    is_read     TINYINT(1)   NOT NULL DEFAULT 0,
    type        VARCHAR(20)  NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE watchlist (
    user_id  INT       NOT NULL,
    movie_id INT       NOT NULL,
    added_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- SEED: SEAT PRICING
-- =====================================================================
INSERT INTO seat_pricing (seat_type, price) VALUES
('standard', 1500), ('premium', 2500), ('vip', 4000), ('couple', 3500);

-- =====================================================================
-- SEED: USERS  (passwords: admin -> admin123, kasun -> user123)
-- =====================================================================
INSERT INTO users (name, email, phone, role, password_hash, avatar) VALUES
('Chamuditha', 'chamuditha@email.com', '+94 77 123 4567', 'admin', '$2b$10$K88hnWr8GSfxRUlVwI5HIOlI0OJg2U8zQtDs9nXsJo3bypOs8ITK6', 'C'),
('Kasun Perera', 'kasun@email.com', '+94 71 234 5678', 'user', '$2y$10$XMyT8HVo2END07.2I2O0iOBdWtec4Oq6QE2gIfUwe9Sg8topJjGK6', 'K');

-- =====================================================================
-- SEED: CINEMAS
-- =====================================================================
INSERT INTO cinemas (id, name, location, address, phone, email, opening_hours, image, features) VALUES
(1, 'CINEPLEX COLOMBO', 'Colombo', 'No. 123, Galle Road, Colombo 03', '+94 11 234 5678', 'colombo@cinemax.lk', '10:00 AM - 11:30 PM', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=60', 'IMAX,3D,4DX,VIP,Premium'),
(2, 'CINEPLEX KANDY', 'Kandy', 'No. 45, Dalada Veediya, Kandy', '+94 81 234 5678', 'kandy@cinemax.lk', '10:00 AM - 11:00 PM', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=60', '3D,VIP,Premium'),
(3, 'CINEPLEX GALLE', 'Galle', 'No. 12, Lighthouse Street, Galle', '+94 91 234 5678', 'galle@cinemax.lk', '11:00 AM - 10:30 PM', 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=900&q=60', '3D,Premium'),
(4, 'CINEPLEX NEGOMBO', 'Negombo', 'No. 78, Main Street, Negombo', '+94 31 234 5678', 'negombo@cinemax.lk', '10:30 AM - 11:00 PM', 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=900&q=60', '3D,Premium'),
(5, 'CINEPLEX JAFFNA', 'Jaffna', 'No. 33, Clock Tower Road, Jaffna', '+94 21 234 5678', 'jaffna@cinemax.lk', '11:00 AM - 10:00 PM', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=900&q=60', '3D,Premium');

-- =====================================================================
-- SEED: HALLS
-- =====================================================================
INSERT INTO halls (id, cinema_id, name, hall_type, capacity, layout, amenities, image) VALUES
(1,  1, 'Hall 01', 'IMAX',      96, '8 x 12', 'IMAX 70mm, Dolby Atmos, Recliner Seats', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=60'),
(2,  1, 'Hall 02', '3D',        96, '8 x 12', 'RealD 3D, Dolby 7.1, Laser Projection',     'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=60'),
(3,  1, 'Hall 03', 'Standard',  96, '8 x 12', 'Dolby 5.1, Comfort Seats',                  'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60'),
(4,  1, 'Hall 04', '4DX',       96, '8 x 12', 'Motion Seats, Wind & Water FX, Dolby Atmos','https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=60'),
(5,  1, 'Hall 05', 'VIP',       96, '8 x 12', 'Luxury Recliners, In-seat Service, Private Lounge', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=60'),
(6,  2, 'Hall 01', '3D',        96, '8 x 12', 'RealD 3D, Dolby 7.1, Laser Projection',     'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=60'),
(7,  2, 'Hall 02', 'Standard',  96, '8 x 12', 'Dolby 5.1, Comfort Seats',                  'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60'),
(8,  2, 'Hall 03', 'VIP',       96, '8 x 12', 'Luxury Recliners, In-seat Service',          'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=60'),
(9,  3, 'Hall 01', '3D',        96, '8 x 12', 'RealD 3D, Dolby 7.1',                        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=60'),
(10, 3, 'Hall 02', 'Standard',  96, '8 x 12', 'Dolby 5.1',                                   'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60'),
(11, 4, 'Hall 01', '3D',        96, '8 x 12', 'RealD 3D, Dolby 7.1',                        'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=60'),
(12, 4, 'Hall 02', 'Standard',  96, '8 x 12', 'Dolby 5.1',                                   'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=60'),
(13, 5, 'Hall 01', 'Standard',  96, '8 x 12', 'Dolby 5.1',                                   'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60'),
(14, 5, 'Hall 02', 'Standard',  96, '8 x 12', 'Dolby 5.1',                                   'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=60');

-- =====================================================================
-- SEED: SEATS (96 per hall: rows A-H x seats 1-12)
-- =====================================================================
INSERT INTO seats (hall_id, seat_row, seat_number, seat_type, is_wheelchair)
SELECT h.id,
       CHAR(64 + r),
       n,
       CASE WHEN r IN (1,2,3) THEN 'standard'
            WHEN r IN (4,5) THEN 'premium'
            WHEN r IN (6,7) THEN 'vip'
            ELSE 'couple' END,
       CASE WHEN r = 1 AND n IN (1,12) THEN 1 ELSE 0 END
FROM halls h
CROSS JOIN (SELECT 1 r UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) r_vals
CROSS JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
            UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) n_vals;

-- =====================================================================
-- SEED: MOVIES (12, ids match APP_DATA.movies)
-- =====================================================================
INSERT INTO movies (id, title, description, director, duration_min, rating, language, release_date, status, poster_url, trailer_id, base_price, popularity, featured) VALUES
(1, 'Avatar: The Way of Water', 'Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure.', 'James Cameron', 192, 8.5, 'English', '2026-09-01', 'now_showing', 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 'aM6VQBU5Ch0', 1500, 95, 1),
(2, 'Interstellar', 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.', 'Christopher Nolan', 169, 8.7, 'English', '2026-08-15', 'now_showing', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'zSWdZVtXT7E', 1800, 92, 0),
(3, 'Spider-Man: No Way Home', 'Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous.', 'Jon Watts', 148, 8.3, 'English', '2026-09-05', 'now_showing', 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', 'JfVOs4VSpmA', 1600, 90, 0),
(4, 'The Batman', 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city''s hidden corruption and question his family''s involvement.', 'Matt Reeves', 176, 8.1, 'English', '2026-08-20', 'now_showing', 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', 'mqqft2x_Aa4', 1500, 85, 0),
(5, 'Dune: Part Two', 'Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe.', 'Denis Villeneuve', 166, 8.8, 'English', '2026-09-10', 'now_showing', 'https://vega-intl.com/uploads/posts/covers/1ddune2024.jpg', 'Way9Dexny3w', 1700, 94, 0),
(6, 'Oppenheimer', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.', 'Christopher Nolan', 180, 8.9, 'English', '2026-07-21', 'now_showing', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'uYPbbksJxIg', 2000, 93, 0),
(7, 'Gini Avi Saha Gini Keli', 'A romantic comedy-drama that explores the complexities of modern relationships in Sri Lanka, blending humor with heartfelt moments.', 'Udayakantha Warnasuriya', 125, 7.2, 'Sinhala', '2026-09-08', 'now_showing', 'https://m.media-amazon.com/images/M/MV5BYTY2NDhjNmItYzJhYi00MTAyLWJmZWEtNjhkMjc2NmUxNDdmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', '', 800, 70, 0),
(8, 'Pathaan', 'An Indian spy takes on a ruthless mercenary who plans to attack India with a deadly virus. High-octane action sequences drive this espionage thriller.', 'Siddharth Anand', 146, 7.8, 'Hindi', '2026-08-25', 'now_showing', 'https://images.news18.com/ibnkhabar/uploads/2023/01/Shah-Rukh-khan-Pathaan.jpg', 'vsonI2QhuM0', 1200, 82, 0),
(9, 'Moana 2', 'After receiving an unexpected call from her wayfinding ancestors, Moana must journey to the far seas of Oceania after a dangerous adventure.', 'David Derrick Jr.', 100, 7.9, 'English', '2026-09-15', 'coming_soon', 'https://image.tmdb.org/t/p/w500/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg', 'hDZ7y8xD5co', 1400, 88, 0),
(10, 'John Wick: Chapter 4', 'With the price on his head ever increasing, legendary hit man John Wick takes his fight against the High Table global as he seeks out the most powerful players in the underworld.', 'Chad Stahelski', 169, 8.0, 'English', '2026-08-10', 'now_showing', 'https://www.themoviedb.org/t/p/original/3BcrJT9AHR9SKerlY3WQAXgisfu.jpg', 'C0BMx-qxsP4', 1500, 87, 0),
(11, 'Aloko Udapadi', 'A historical drama depicting the life of King Dutugemunu and the legendary battle that unified Sri Lanka.', 'Chandran Ratnam', 155, 7.5, 'Sinhala', '2026-07-04', 'now_showing', 'https://m.media-amazon.com/images/M/MV5BMGZlZjA3YzItNmIyYi00MDg1LThkZjAtNDg5ZmMyZGQyODVkXkEyXkFqcGc@._V1_.jpg', 'XxRQ-1yfHBU', 900, 65, 0),
(12, 'Dedunu Akare', 'A touching story of love and sacrifice set against the beautiful landscapes of Sri Lanka''s hill country.', 'Prasanna Vithanage', 118, 7.1, 'Sinhala', '2026-09-20', 'coming_soon', 'https://www.films.lk/uploads/films/profiles/small/Dedunu-Akase-sri-lanka-Sinhala-film-2153.jpg', '-Ei0qaIuWcs', 750, 55, 0);

-- genres
INSERT INTO movies_genres (movie_id, genre) VALUES
(1,'Action'),(1,'Sci-Fi'),(1,'Adventure'),
(2,'Sci-Fi'),(2,'Drama'),(2,'Adventure'),
(3,'Action'),(3,'Sci-Fi'),(3,'Adventure'),
(4,'Action'),(4,'Crime'),(4,'Drama'),
(5,'Sci-Fi'),(5,'Adventure'),(5,'Drama'),
(6,'Drama'),(6,'History'),(6,'Biography'),
(7,'Romance'),(7,'Comedy'),(7,'Drama'),
(8,'Action'),(8,'Thriller'),(8,'Adventure'),
(9,'Animation'),(9,'Adventure'),(9,'Comedy'),
(10,'Action'),(10,'Thriller'),(10,'Crime'),
(11,'History'),(11,'Drama'),(11,'War'),
(12,'Romance'),(12,'Drama');

-- subtitles
INSERT INTO movies_subtitles (movie_id, subtitle) VALUES
(1,'Sinhala'),(1,'Tamil'),
(2,'Sinhala'),(2,'Tamil'),
(3,'Sinhala'),(3,'Tamil'),
(4,'Sinhala'),(4,'Tamil'),
(5,'Sinhala'),(5,'Tamil'),
(6,'Sinhala'),(6,'Tamil'),
(7,'English'),
(8,'Sinhala'),(8,'Tamil'),(8,'English'),
(9,'Sinhala'),(9,'Tamil'),
(10,'Sinhala'),(10,'Tamil'),
(11,'English'),(11,'Tamil'),
(12,'English');

-- formats
INSERT INTO movies_formats (movie_id, format) VALUES
(1,'IMAX'),(1,'3D'),(1,'4DX'),
(2,'IMAX'),(2,'3D'),
(3,'IMAX'),(3,'3D'),(3,'4DX'),
(4,'IMAX'),(4,'3D'),
(5,'IMAX'),(5,'3D'),(5,'4DX'),
(6,'IMAX'),
(7,'3D'),
(8,'IMAX'),(8,'3D'),
(9,'3D'),
(10,'IMAX'),(10,'4DX'),
(11,'3D');

-- cast
INSERT INTO movies_cast (movie_id, cast_name) VALUES
(1,'Sam Worthington'),(1,'Zoe Saldana'),(1,'Sigourney Weaver'),(1,'Kate Winslet'),
(2,'Matthew McConaughey'),(2,'Anne Hathaway'),(2,'Jessica Chastain'),(2,'Michael Caine'),
(3,'Tom Holland'),(3,'Zendaya'),(3,'Benedict Cumberbatch'),(3,'Tobey Maguire'),
(4,'Robert Pattinson'),(4,'Zoe Kravitz'),(4,'Paul Dano'),(4,'Jeffrey Wright'),
(5,'Timothee Chalamet'),(5,'Zendaya'),(5,'Austin Butler'),(5,'Florence Pugh'),
(6,'Cillian Murphy'),(6,'Emily Blunt'),(6,'Matt Damon'),(6,'Robert Downey Jr.'),
(7,'Mahesh Ariyarathna'),(7,'Pooja Umashankar'),(7,'Buddhika Jayaratne'),
(8,'Shah Rukh Khan'),(8,'Deepika Padukone'),(8,'John Abraham'),
(9,'Auli''i Cravalho'),(9,'Dwayne Johnson'),(9,'Rachel House'),
(10,'Keanu Reeves'),(10,'Donnie Yen'),(10,'Bill Skarsgard'),(10,'Laurence Fishburne'),
(11,'Ravindra Randeniya'),(11,'Malini Fonseka'),(11,'Tony Ranasinghe'),
(12,'Nuwan Jayaratne'),(12,'Shalani Tharaka'),(12,'Hemasiri Liyanage');

-- =====================================================================
-- SEED: SHOWTIMES  (2026-09-24; mirrors APP_DATA.showtimes)
-- note: hall2 19:30 and movie6/hall7 19:30 are added so the demo
-- bookings below map to real showtimes.
-- =====================================================================
INSERT INTO showtimes (movie_id, hall_id, show_date, show_time) VALUES
(1, 1, '2026-09-24', '10:30:00'),
(1, 1, '2026-09-24', '13:30:00'),
(1, 1, '2026-09-24', '16:30:00'),
(1, 1, '2026-09-24', '19:30:00'),
(1, 1, '2026-09-24', '22:30:00'),
(1, 2, '2026-09-24', '11:00:00'),
(1, 2, '2026-09-24', '14:00:00'),
(1, 2, '2026-09-24', '17:00:00'),
(1, 2, '2026-09-24', '20:00:00'),
(1, 2, '2026-09-24', '19:30:00'),
(1, 6, '2026-09-24', '12:00:00'),
(1, 6, '2026-09-24', '15:30:00'),
(1, 6, '2026-09-24', '19:00:00'),
(1, 9, '2026-09-24', '13:00:00'),
(1, 9, '2026-09-24', '16:00:00'),
(1, 9, '2026-09-24', '19:30:00'),
(2, 1, '2026-09-24', '11:00:00'),
(2, 1, '2026-09-24', '14:30:00'),
(2, 1, '2026-09-24', '18:00:00'),
(2, 3, '2026-09-24', '10:00:00'),
(2, 3, '2026-09-24', '13:00:00'),
(2, 3, '2026-09-24', '16:00:00'),
(2, 3, '2026-09-24', '19:30:00'),
(5, 1, '2026-09-24', '10:00:00'),
(5, 1, '2026-09-24', '13:00:00'),
(5, 1, '2026-09-24', '16:00:00'),
(5, 1, '2026-09-24', '19:00:00'),
(5, 1, '2026-09-24', '22:00:00'),
(5, 2, '2026-09-24', '11:30:00'),
(5, 2, '2026-09-24', '15:00:00'),
(5, 2, '2026-09-24', '18:30:00'),
(5, 7, '2026-09-24', '12:00:00'),
(5, 7, '2026-09-24', '15:00:00'),
(5, 7, '2026-09-24', '18:30:00'),
(6, 7, '2026-09-24', '19:30:00');

-- =====================================================================
-- SEED: SHOWTIME SEATS (every seat of every showtime, all available)
-- =====================================================================
INSERT INTO showtime_seats (showtime_id, seat_id, status)
SELECT st.id, s.id, 'available'
FROM showtimes st
JOIN seats s ON s.hall_id = st.hall_id;

-- Mark the demo "occupied" seats as booked on Avatar / Hall 01 / 4:30 PM
UPDATE showtime_seats ss
JOIN showtimes st ON st.id = ss.showtime_id
JOIN seats s     ON s.id = ss.seat_id
SET ss.status = 'booked'
WHERE st.movie_id = 1 AND st.hall_id = 1 AND st.show_time = '16:30:00'
  AND ( (s.seat_row = 'A' AND s.seat_number IN (3,4))
     OR (s.seat_row = 'B' AND s.seat_number IN (7,8))
     OR (s.seat_row = 'C' AND s.seat_number = 5)
     OR (s.seat_row = 'D' AND s.seat_number IN (2,3))
     OR (s.seat_row = 'E' AND s.seat_number = 10)
     OR (s.seat_row = 'F' AND s.seat_number = 6)
     OR (s.seat_row = 'G' AND s.seat_number IN (9,10)) );

-- =====================================================================
-- SEED: BOOKINGS (the 5 demo bookings -> real showtimes/seats)
-- =====================================================================
INSERT INTO bookings (booking_ref, user_id, showtime_id, seats_summary, ticket_count, total_amount, convenience_fee, status, payment_method, booking_date) VALUES
('CIN10001', 1, (SELECT id FROM showtimes WHERE movie_id=1 AND hall_id=1 AND show_time='16:30:00'), 'D4, D5', 2, 5200.00, 200.00, 'confirmed', 'Visa', '2026-08-28'),
('CIN10002', 1, (SELECT id FROM showtimes WHERE movie_id=5 AND hall_id=1 AND show_time='13:00:00'), 'F5, F6', 2, 8400.00, 200.00, 'confirmed', 'Mastercard', '2026-09-02'),
('CIN10003', 1, (SELECT id FROM showtimes WHERE movie_id=6 AND hall_id=7 AND show_time='19:30:00'), 'C5, C6', 2, 4200.00, 200.00, 'confirmed', 'Visa', '2026-09-10'),
('CIN28492', 2, (SELECT id FROM showtimes WHERE movie_id=1 AND hall_id=2 AND show_time='19:30:00'), 'D4, D5', 2, 5400.00, 200.00, 'confirmed', 'Visa', '2026-09-10'),
('CIN28501', 2, (SELECT id FROM showtimes WHERE movie_id=5 AND hall_id=1 AND show_time='16:00:00'), 'F5, F6', 2, 8200.00, 200.00, 'confirmed', 'Mastercard', '2026-09-09');

-- booking_seats (per booked seat: its type + price) + flip those seats to booked
INSERT INTO booking_seats (booking_id, showtime_seat_id, seat_type, price)
SELECT b.id, ss.id, s.seat_type, sp.price
FROM bookings b
JOIN showtimes st      ON st.id = b.showtime_id
JOIN seats s           ON s.hall_id = st.hall_id
JOIN seat_pricing sp   ON sp.seat_type = s.seat_type
JOIN showtime_seats ss ON ss.showtime_id = st.id AND ss.seat_id = s.id
WHERE (b.booking_ref = 'CIN10001' AND s.seat_row='D' AND s.seat_number IN (4,5))
   OR (b.booking_ref = 'CIN10002' AND s.seat_row='F' AND s.seat_number IN (5,6))
   OR (b.booking_ref = 'CIN10003' AND s.seat_row='C' AND s.seat_number IN (5,6))
   OR (b.booking_ref = 'CIN28492' AND s.seat_row='D' AND s.seat_number IN (4,5))
   OR (b.booking_ref = 'CIN28501' AND s.seat_row='F' AND s.seat_number IN (5,6));

UPDATE showtime_seats ss
JOIN booking_seats bs ON bs.showtime_seat_id = ss.id
SET ss.status = 'booked';

-- =====================================================================
-- SEED: OFFERS
-- =====================================================================
INSERT INTO offers (title, description, discount, code, valid_from, valid_to, offer_type, icon, color) VALUES
('STUDENT OFFER', 'Get 20% off on all movie tickets from Monday to Thursday. Valid student ID required at the counter.', 20, 'STUDENT20', '2026-09-01', '2026-12-31', 'percentage', '🎓', '#3498db'),
('FAMILY PACKAGE', 'Book 4 or more tickets and get a free large popcorn + 2 drinks. Valid for all days.', 0, 'FAMILY4', '2026-09-01', '2026-12-31', 'bundle', '👨‍👩‍👧‍👦', '#e74c3c'),
('WEDNESDAY SPECIAL', 'All tickets at LKR 800 every Wednesday! Limited seats available.', 50, 'WED800', '2026-09-01', '2026-12-31', 'fixed', '🎯', '#f39c12'),
('VIP UPGRADE', 'Upgrade to VIP seating for only LKR 500 extra on any booking. Includes complimentary snacks.', 0, 'VIPUP', '2026-09-01', '2026-10-31', 'upgrade', '👑', '#9b59b6');

-- =====================================================================
-- SEED: NOTIFICATIONS (for user 2)
-- =====================================================================
INSERT INTO notifications (user_id, title, message, time_label, is_read, type) VALUES
(2, 'Booking Confirmed!', 'Your booking for Avatar: The Way of Water on 15 Sep has been confirmed.', '2 hours ago', 0, 'booking'),
(2, 'Movie Starting Soon', 'Interstellar starts in 2 hours at CINEPLEX COLOMBO, Hall 03.', '5 hours ago', 0, 'reminder'),
(2, 'New Movie Available!', 'Dune: Part Two is now showing! Book your tickets now.', '1 day ago', 1, 'new_movie'),
(2, 'Special Offer', 'Wednesday Special: All tickets at LKR 800! Use code WED800.', '2 days ago', 1, 'offer');

-- =====================================================================
-- SEED: WATCHLIST (user 1 -> Avatar, Interstellar, Dune)
-- =====================================================================
INSERT INTO watchlist (user_id, movie_id) VALUES (1, 1), (1, 2), (1, 5);