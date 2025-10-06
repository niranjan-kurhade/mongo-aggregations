const express = require('express');
const mongoose = require('mongoose');
const Movie = require('./models/movie');
const User = require('./models/user');
const Booking = require('./models/booking');

const app = express();
app.use(express.json());


mongoose.connect('mongodb://localhost:27017/moviebooking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


app.post('/movies', async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(200).json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.post('/bookings', async (req, res) => {
  try {
    const { userId, movieId } = req.body;
    const user = await User.findById(userId);
    const movie = await Movie.findById(movieId);
    if (!user || !movie) {
      return res.status(400).json({ error: 'User or Movie not found' });
    }
    const booking = new Booking(req.body);
    await booking.save();
    res.status(200).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.get('/analytics/movie-bookings', async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $group: {
          _id: "$movieId",
          totalBookings: { $sum: 1 },
          totalSeats: { $sum: "$seats" }
        }
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movie"
        }
      },
      { $unwind: "$movie" },
      {
        $project: {
          movieTitle: "$movie.title",
          totalBookings: 1,
          totalSeats: 1
        }
      }
    ]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/analytics/user-bookings', async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "movies",
          localField: "movieId",
          foreignField: "_id",
          as: "movie"
        }
      },
      { $unwind: "$movie" },
      {
        $group: {
          _id: "$userId",
          userName: { $first: "$user.name" },
          bookings: {
            $push: {
              movieTitle: "$movie.title",
              bookingDate: "$bookingDate",
              seats: "$seats",
              status: "$status"
            }
          }
        }
      }
    ]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/analytics/top-users', async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $group: {
          _id: "$userId",
          bookingCount: { $sum: 1 }
        }
      },
      { $match: { bookingCount: { $gt: 2 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          userName: "$user.name",
          bookingCount: 1
        }
      }
    ]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/analytics/genre-wise-bookings', async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $lookup: {
          from: "movies",
          localField: "movieId",
          foreignField: "_id",
          as: "movie"
        }
      },
      { $unwind: "$movie" },
      {
        $group: {
          _id: "$movie.genre",
          totalSeats: { $sum: "$seats" }
        }
      }
    ]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/analytics/active-bookings', async (req, res) => {
  try {
    const result = await Booking.aggregate([
      { $match: { status: "Booked" } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "movies",
          localField: "movieId",
          foreignField: "_id",
          as: "movie"
        }
      },
      { $unwind: "$movie" },
      {
        $project: {
          userName: "$user.name",
          movieTitle: "$movie.title",
          seats: 1,
          bookingDate: 1
        }
      }
    ]);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
