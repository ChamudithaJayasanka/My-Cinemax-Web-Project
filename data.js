const APP_DATA = {
  movies: [
    {
      id: 1,
      title: "Avatar: The Way of Water",
      description: "Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure.",
      director: "James Cameron",
      cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Kate Winslet"],
      genre: ["Action", "Sci-Fi", "Adventure"],
      duration: 192,
      rating: 8.5,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-09-01",
      status: "now_showing",
      poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      trailer: "aM6VQBU5Ch0",
      posterGradient: ["#006994", "#00CED1"],
      formats: ["IMAX", "3D", "4DX"],
      basePrice: 1500,
      popularity: 95,
      featured: true
    },
    {
      id: 2,
      title: "Interstellar",
      description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
      director: "Christopher Nolan",
      cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
      genre: ["Sci-Fi", "Drama", "Adventure"],
      duration: 169,
      rating: 8.7,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-08-15",
      status: "now_showing",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      trailer: "zSWdZVtXT7E",
      posterGradient: ["#1a1a2e", "#e94560"],
      formats: ["IMAX", "3D"],
      basePrice: 1800,
      popularity: 92,
      featured: false
    },
    {
      id: 3,
      title: "Spider-Man: No Way Home",
      description: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous.",
      director: "Jon Watts",
      cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch", "Tobey Maguire"],
      genre: ["Action", "Sci-Fi", "Adventure"],
      duration: 148,
      rating: 8.3,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-09-05",
      status: "now_showing",
      poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      trailer: "JfVOs4VSpmA",
      posterGradient: ["#c0392b", "#2c3e50"],
      formats: ["IMAX", "3D", "4DX"],
      basePrice: 1600,
      popularity: 90,
      featured: false
    },
    {
      id: 4,
      title: "The Batman",
      description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
      director: "Matt Reeves",
      cast: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano", "Jeffrey Wright"],
      genre: ["Action", "Crime", "Drama"],
      duration: 176,
      rating: 8.1,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-08-20",
      status: "now_showing",
      poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      trailer: "mqqft2x_Aa4",
      posterGradient: ["#2c3e50", "#e74c3c"],
      formats: ["IMAX", "3D"],
      basePrice: 1500,
      popularity: 85,
      featured: false
    },
    {
      id: 5,
      title: "Dune: Part Two",
      description: "Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe.",
      director: "Denis Villeneuve",
      cast: ["Timothée Chalamet", "Zendaya", "Austin Butler", "Florence Pugh"],
      genre: ["Sci-Fi", "Adventure", "Drama"],
      duration: 166,
      rating: 8.8,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-09-10",
      status: "now_showing",
      poster: "https://vega-intl.com/uploads/posts/covers/1ddune2024.jpg",
      trailer: "Way9Dexny3w",
      posterGradient: ["#c2a878", "#8b7355"],
      formats: ["IMAX", "3D", "4DX"],
      basePrice: 1700,
      popularity: 94,
      featured: false
    },
    {
      id: 6,
      title: "Oppenheimer",
      description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
      director: "Christopher Nolan",
      cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
      genre: ["Drama", "History", "Biography"],
      duration: 180,
      rating: 8.9,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-07-21",
      status: "now_showing",
      poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      trailer: "uYPbbksJxIg",
      posterGradient: ["#e67e22", "#2c3e50"],
      formats: ["IMAX"],
      basePrice: 2000,
      popularity: 93,
      featured: false
    },
    {
      id: 7,
      title: "Gini Avi Saha Gini Keli",
      description: "A romantic comedy-drama that explores the complexities of modern relationships in Sri Lanka, blending humor with heartfelt moments.",
      director: "Udayakantha Warnasuriya",
      cast: ["Mahesh Ariyarathna", "Pooja Umashankar", "Buddhika Jayaratne"],
      genre: ["Romance", "Comedy", "Drama"],
      duration: 125,
      rating: 7.2,
      language: "Sinhala",
      subtitles: ["English"],
      releaseDate: "2026-09-08",
      status: "now_showing",
      poster: "https://m.media-amazon.com/images/M/MV5BYTY2NDhjNmItYzJhYi00MTAyLWJmZWEtNjhkMjc2NmUxNDdmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      posterGradient: ["#8e44ad", "#e91e63"],
      formats: ["3D"],
      basePrice: 800,
      popularity: 70,
      featured: false
    },
    {
      id: 8,
      title: "Pathaan",
      description: "An Indian spy takes on a ruthless mercenary who plans to attack India with a deadly virus. High-octane action sequences drive this espionage thriller.",
      director: "Siddharth Anand",
      cast: ["Shah Rukh Khan", "Deepika Padukone", "John Abraham"],
      genre: ["Action", "Thriller", "Adventure"],
      duration: 146,
      rating: 7.8,
      language: "Hindi",
      subtitles: ["Sinhala", "Tamil", "English"],
      releaseDate: "2026-08-25",
      status: "now_showing",
      poster: "https://images.news18.com/ibnkhabar/uploads/2023/01/Shah-Rukh-khan-Pathaan.jpg",
      trailer: "vsonI2QhuM0",
      posterGradient: ["#27ae60", "#f39c12"],
      formats: ["IMAX", "3D"],
      basePrice: 1200,
      popularity: 82,
      featured: false
    },
    {
      id: 9,
      title: "Moana 2",
      description: "After receiving an unexpected call from her wayfinding ancestors, Moana must journey to the far seas of Oceania after a dangerous adventure.",
      director: "David Derrick Jr.",
      cast: ["Auli'i Cravalho", "Dwayne Johnson", "Rachel House"],
      genre: ["Animation", "Adventure", "Comedy"],
      duration: 100,
      rating: 7.9,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-09-15",
      status: "coming_soon",
      poster: "https://image.tmdb.org/t/p/w500/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg",
      trailer: "hDZ7y8xD5co",
      posterGradient: ["#0097e6", "#00cec9"],
      formats: ["3D"],
      basePrice: 1400,
      popularity: 88,
      featured: false
    },
    {
      id: 10,
      title: "John Wick: Chapter 4",
      description: "With the price on his head ever increasing, legendary hit man John Wick takes his fight against the High Table global as he seeks out the most powerful players in the underworld.",
      director: "Chad Stahelski",
      cast: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård", "Laurence Fishburne"],
      genre: ["Action", "Thriller", "Crime"],
      duration: 169,
      rating: 8.0,
      language: "English",
      subtitles: ["Sinhala", "Tamil"],
      releaseDate: "2026-08-10",
      status: "now_showing",
      poster: "https://www.themoviedb.org/t/p/original/3BcrJT9AHR9SKerlY3WQAXgisfu.jpg",
      trailer: "C0BMx-qxsP4",
      posterGradient: ["#c0392b", "#1a1a2e"],
      formats: ["IMAX", "4DX"],
      basePrice: 1500,
      popularity: 87,
      featured: false
    },
    {
      id: 11,
      title: "Aloko Udapadi",
      description: "A historical drama depicting the life of King Dutugemunu and the legendary battle that unified Sri Lanka.",
      director: "Chandran Ratnam",
      cast: ["Ravindra Randeniya", "Malini Fonseka", "Tony Ranasinghe"],
      genre: ["History", "Drama", "War"],
      duration: 155,
      rating: 7.5,
      language: "Sinhala",
      subtitles: ["English", "Tamil"],
      releaseDate: "2026-07-04",
      status: "now_showing",
      poster: "https://m.media-amazon.com/images/M/MV5BMGZlZjA3YzItNmIyYi00MDg1LThkZjAtNDg5ZmMyZGQyODVkXkEyXkFqcGc@._V1_.jpg",
      trailer: "XxRQ-1yfHBU",
      posterGradient: ["#f39c12", "#8b4513"],
      formats: ["3D"],
      basePrice: 900,
      popularity: 65,
      featured: false
    },
    {
      id: 12,
      title: "Dedunu Akare",
      description: "A touching story of love and sacrifice set against the beautiful landscapes of Sri Lanka's hill country.",
      director: "Prasanna Vithanage",
      cast: ["Nuwan Jayaratne", "Shalani Tharaka", "Hemasiri Liyanage"],
      genre: ["Romance", "Drama"],
      duration: 118,
      rating: 7.1,
      language: "Sinhala",
      subtitles: ["English"],
      releaseDate: "2026-09-20",
      status: "coming_soon",
      poster: "https://www.films.lk/uploads/films/profiles/small/Dedunu-Akase-sri-lanka-Sinhala-film-2153.jpg",
      trailer: "-Ei0qaIuWcs",
      posterGradient: ["#3498db", "#ecf0f1"],
      formats: [],
      basePrice: 750,
      popularity: 55,
      featured: false
    }
  ],

  cinemas: [
    {
      id: 1,
      name: "CINEPLEX COLOMBO",
      location: "Colombo",
      address: "No. 123, Galle Road, Colombo 03",
      phone: "+94 11 234 5678",
      email: "colombo@cinemax.lk",
      openingHours: "10:00 AM – 11:30 PM",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=60",
      features: ["IMAX", "3D", "4DX", "VIP", "Premium"],
      halls: [
        { id: 1, name: "Hall 01", type: "IMAX", capacity: 250, layout: "16 × 16", amenities: ["IMAX 70mm", "Dolby Atmos", "Recliner Seats"], image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=60" },
        { id: 2, name: "Hall 02", type: "3D", capacity: 180, layout: "12 × 15", amenities: ["RealD 3D", "Dolby 7.1", "Laser Projection"], image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=60" },
        { id: 3, name: "Hall 03", type: "Standard", capacity: 150, layout: "10 × 15", amenities: ["Dolby 5.1", "Comfort Seats"], image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60" },
        { id: 4, name: "Hall 04", type: "4DX", capacity: 120, layout: "10 × 12", amenities: ["Motion Seats", "Wind & Water FX", "Dolby Atmos"], image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=60" },
        { id: 5, name: "Hall 05", type: "VIP", capacity: 60, layout: "6 × 10", amenities: ["Luxury Recliners", "In-seat Service", "Private Lounge"], image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=60" }
      ]
    },
    {
      id: 2,
      name: "CINEPLEX KANDY",
      location: "Kandy",
      address: "No. 45, Dalada Veediya, Kandy",
      phone: "+94 81 234 5678",
      email: "kandy@cinemax.lk",
      openingHours: "10:00 AM – 11:00 PM",
      image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=60",
      features: ["3D", "VIP", "Premium"],
      halls: [
        { id: 6, name: "Hall 01", type: "3D", capacity: 200, layout: "13 × 16", amenities: ["RealD 3D", "Dolby 7.1", "Laser Projection"], image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=60" },
        { id: 7, name: "Hall 02", type: "Standard", capacity: 150, layout: "10 × 15", amenities: ["Dolby 5.1", "Comfort Seats"], image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60" },
        { id: 8, name: "Hall 03", type: "VIP", capacity: 50, layout: "5 × 10", amenities: ["Luxury Recliners", "In-seat Service"], image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=60" }
      ]
    },
    {
      id: 3,
      name: "CINEPLEX GALLE",
      location: "Galle",
      address: "No. 12, Lighthouse Street, Galle",
      phone: "+94 91 234 5678",
      email: "galle@cinemax.lk",
      openingHours: "11:00 AM – 10:30 PM",
      image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=900&q=60",
      features: ["3D", "Premium"],
      halls: [
        { id: 9, name: "Hall 01", type: "3D", capacity: 160, layout: "10 × 16", amenities: ["RealD 3D", "Dolby 7.1"], image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=60" },
        { id: 10, name: "Hall 02", type: "Standard", capacity: 120, layout: "8 × 15", amenities: ["Dolby 5.1"], image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60" }
      ]
    },
    {
      id: 4,
      name: "CINEPLEX NEGOMBO",
      location: "Negombo",
      address: "No. 78, Main Street, Negombo",
      phone: "+94 31 234 5678",
      email: "negombo@cinemax.lk",
      openingHours: "10:30 AM – 11:00 PM",
      image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=900&q=60",
      features: ["3D", "Premium"],
      halls: [
        { id: 11, name: "Hall 01", type: "3D", capacity: 140, layout: "10 × 14", amenities: ["RealD 3D", "Dolby 7.1"], image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=60" },
        { id: 12, name: "Hall 02", type: "Standard", capacity: 100, layout: "8 × 13", amenities: ["Dolby 5.1"], image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=60" }
      ]
    },
    {
      id: 5,
      name: "CINEPLEX JAFFNA",
      location: "Jaffna",
      address: "No. 33, Clock Tower Road, Jaffna",
      phone: "+94 21 234 5678",
      email: "jaffna@cinemax.lk",
      openingHours: "11:00 AM – 10:00 PM",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=900&q=60",
      features: ["3D", "Premium"],
      halls: [
        { id: 13, name: "Hall 01", type: "Standard", capacity: 120, layout: "8 × 15", amenities: ["Dolby 5.1"], image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=60" },
        { id: 14, name: "Hall 02", type: "Standard", capacity: 100, layout: "8 × 13", amenities: ["Dolby 5.1"], image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=60" }
      ]
    }
  ],

  showtimes: {
    1: {
      1: {
        1: [
          { time: "10:30 AM", available: 45 },
          { time: "1:30 PM", available: 32 },
          { time: "4:30 PM", available: 28 },
          { time: "7:30 PM", available: 15 },
          { time: "10:30 PM", available: 50 }
        ],
        2: [
          { time: "11:00 AM", available: 40 },
          { time: "2:00 PM", available: 35 },
          { time: "5:00 PM", available: 20 },
          { time: "8:00 PM", available: 10 }
        ]
      },
      2: {
        6: [
          { time: "12:00 PM", available: 38 },
          { time: "3:30 PM", available: 25 },
          { time: "7:00 PM", available: 18 }
        ]
      },
      3: {
        9: [
          { time: "1:00 PM", available: 30 },
          { time: "4:00 PM", available: 22 },
          { time: "7:30 PM", available: 12 }
        ]
      }
    },
    2: {
      1: {
        1: [
          { time: "11:00 AM", available: 50 },
          { time: "2:30 PM", available: 42 },
          { time: "6:00 PM", available: 35 }
        ],
        3: [
          { time: "10:00 AM", available: 45 },
          { time: "1:00 PM", available: 38 },
          { time: "4:00 PM", available: 25 },
          { time: "7:30 PM", available: 18 }
        ]
      }
    },
    5: {
      1: {
        1: [
          { time: "10:00 AM", available: 48 },
          { time: "1:00 PM", available: 40 },
          { time: "4:00 PM", available: 30 },
          { time: "7:00 PM", available: 20 },
          { time: "10:00 PM", available: 50 }
        ],
        2: [
          { time: "11:30 AM", available: 35 },
          { time: "3:00 PM", available: 28 },
          { time: "6:30 PM", available: 15 }
        ]
      },
      2: {
        7: [
          { time: "12:00 PM", available: 40 },
          { time: "3:00 PM", available: 30 },
          { time: "6:30 PM", available: 22 }
        ]
      }
    }
  },

  seatLayout: {
    rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
    seatsPerRow: 12,
    types: {
      A: "standard", B: "standard", C: "standard",
      D: "premium", E: "premium",
      F: "vip", G: "vip",
      H: "couple"
    },
    prices: {
      standard: 1500,
      premium: 2500,
      vip: 4000,
      couple: 3500
    },
    occupied: ["A3", "A4", "B7", "B8", "C5", "D2", "D3", "E10", "F6", "G9", "G10"],
    wheelchair: ["A1", "A12"]
  },

  users: [
    {
      id: 1,
      name: "Chamuditha",
      email: "chamuditha@email.com",
      phone: "+94 77 123 4567",
      role: "admin",
      password: "admin123",
      avatar: "C"
    },
    {
      id: 2,
      name: "Kasun Perera",
      email: "kasun@email.com",
      phone: "+94 71 234 5678",
      role: "user",
      password: "user123",
      avatar: "K"
    }
  ],

  bookings: [
    {
      id: "CIN10001",
      userId: 1,
      movieId: 1,
      cinemaId: 1,
      hallId: 1,
      showtime: "4:30 PM",
      date: "2026-09-01",
      seats: ["D4", "D5"],
      seatTypes: ["premium", "premium"],
      ticketCount: 2,
      totalAmount: 5200,
      convenienceFee: 200,
      status: "confirmed",
      bookingDate: "2026-08-28",
      paymentMethod: "Visa"
    },
    {
      id: "CIN10002",
      userId: 1,
      movieId: 5,
      cinemaId: 1,
      hallId: 1,
      showtime: "1:00 PM",
      date: "2026-09-05",
      seats: ["F5", "F6"],
      seatTypes: ["vip", "vip"],
      ticketCount: 2,
      totalAmount: 8400,
      convenienceFee: 200,
      status: "confirmed",
      bookingDate: "2026-09-02",
      paymentMethod: "Mastercard"
    },
    {
      id: "CIN10003",
      userId: 1,
      movieId: 6,
      cinemaId: 2,
      hallId: 7,
      showtime: "7:30 PM",
      date: "2026-09-15",
      seats: ["C5", "C6"],
      seatTypes: ["standard", "standard"],
      ticketCount: 2,
      totalAmount: 4200,
      convenienceFee: 200,
      status: "confirmed",
      bookingDate: "2026-09-10",
      paymentMethod: "Visa"
    },
    {
      id: "CIN28492",
      userId: 2,
      movieId: 1,
      cinemaId: 1,
      hallId: 2,
      showtime: "7:30 PM",
      date: "2026-09-15",
      seats: ["D4", "D5"],
      seatTypes: ["premium", "premium"],
      ticketCount: 2,
      totalAmount: 5400,
      convenienceFee: 200,
      status: "confirmed",
      bookingDate: "2026-09-10",
      paymentMethod: "Visa"
    },
    {
      id: "CIN28501",
      userId: 2,
      movieId: 5,
      cinemaId: 1,
      hallId: 1,
      showtime: "4:00 PM",
      date: "2026-09-12",
      seats: ["F5", "F6"],
      seatTypes: ["vip", "vip"],
      ticketCount: 2,
      totalAmount: 8200,
      convenienceFee: 200,
      status: "confirmed",
      bookingDate: "2026-09-09",
      paymentMethod: "Mastercard"
    }
  ],

  offers: [
    {
      id: 1,
      title: "STUDENT OFFER",
      description: "Get 20% off on all movie tickets from Monday to Thursday. Valid student ID required at the counter.",
      discount: 20,
      code: "STUDENT20",
      validFrom: "2026-09-01",
      validTo: "2026-12-31",
      type: "percentage",
      icon: "🎓",
      color: "#3498db"
    },
    {
      id: 2,
      title: "FAMILY PACKAGE",
      description: "Book 4 or more tickets and get a free large popcorn + 2 drinks. Valid for all days.",
      discount: 0,
      code: "FAMILY4",
      validFrom: "2026-09-01",
      validTo: "2026-12-31",
      type: "bundle",
      icon: "👨‍👩‍👧‍👦",
      color: "#e74c3c"
    },
    {
      id: 3,
      title: "WEDNESDAY SPECIAL",
      description: "All tickets at LKR 800 every Wednesday! Limited seats available.",
      discount: 50,
      code: "WED800",
      validFrom: "2026-09-01",
      validTo: "2026-12-31",
      type: "fixed",
      icon: "🎯",
      color: "#f39c12"
    },
    {
      id: 4,
      title: "VIP UPGRADE",
      description: "Upgrade to VIP seating for only LKR 500 extra on any booking. Includes complimentary snacks.",
      discount: 0,
      code: "VIPUP",
      validFrom: "2026-09-01",
      validTo: "2026-10-31",
      type: "upgrade",
      icon: "👑",
      color: "#9b59b6"
    }
  ],

  notifications: [
    {
      id: 1,
      userId: 2,
      title: "Booking Confirmed!",
      message: "Your booking for Avatar: The Way of Water on 15 Sep has been confirmed.",
      time: "2 hours ago",
      read: false,
      type: "booking"
    },
    {
      id: 2,
      userId: 2,
      title: "Movie Starting Soon",
      message: "Interstellar starts in 2 hours at CINEPLEX COLOMBO, Hall 03.",
      time: "5 hours ago",
      read: false,
      type: "reminder"
    },
    {
      id: 3,
      userId: 2,
      title: "New Movie Available!",
      message: "Dune: Part Two is now showing! Book your tickets now.",
      time: "1 day ago",
      read: true,
      type: "new_movie"
    },
    {
      id: 4,
      userId: 2,
      title: "Special Offer",
      message: "Wednesday Special: All tickets at LKR 800! Use code WED800.",
      time: "2 days ago",
      read: true,
      type: "offer"
    }
  ],

  watchlist: [1, 2, 5],

  adminStats: {
    todayRevenue: 245000,
    todayBookings: 186,
    availableSeats: 342,
    activeMovies: 12,
    weeklyRevenue: [180000, 210000, 195000, 245000, 230000, 280000, 245000],
    dailySales: [145, 168, 155, 186, 172, 210, 186],
    moviePopularity: [
      { name: "Avatar 2", tickets: 342 },
      { name: "Dune 2", tickets: 298 },
      { name: "Interstellar", tickets: 256 },
      { name: "Oppenheimer", tickets: 234 },
      { name: "John Wick 4", tickets: 198 }
    ],
    cinemaPerformance: [
      { name: "Colombo", revenue: 145000, bookings: 112 },
      { name: "Kandy", revenue: 52000, bookings: 42 },
      { name: "Galle", revenue: 28000, bookings: 18 },
      { name: "Negombo", revenue: 12000, bookings: 8 },
      { name: "Jaffna", revenue: 8000, bookings: 6 }
    ],
    seatOccupancy: { standard: 72, premium: 85, vip: 90, couple: 60 }
  }
};
