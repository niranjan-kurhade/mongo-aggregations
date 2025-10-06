const mongoose = require('mongoose');
const movieSchema = new mongoose.Schema({
  _id: String,
  title: String,
  genre: String,
  releaseYear: Number,
  durationMins: Number,
});
module.exports = mongoose.model('Movie', movieSchema);