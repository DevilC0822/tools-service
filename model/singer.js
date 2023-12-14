const mongoose = require('mongoose');

const { Schema } = mongoose;

const Singerschema = new Schema({
  name: String,
});

module.exports = mongoose.model('singers', Singerschema);