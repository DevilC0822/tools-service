const mongoose = require('mongoose');

const { Schema } = mongoose;

const SongSchema = new Schema({
  name: String,
  singer: String,
  url: String,
  fileType: String,
  singerId: String,
  picUrl: String,
});

module.exports = mongoose.model('songs', SongSchema);