const mongoose = require('mongoose');
const config = require('../config/db');

module.exports = (success, error) => {
  mongoose.connect(`mongodb://${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`)
    .then(() => {
      console.log('Database connection successful');
      success();
    })
    .catch((err) => {
      console.log('Database connection error');
      error(err);
    });
};