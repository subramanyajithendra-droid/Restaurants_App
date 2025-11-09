const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: String,
  location: String,
  address: String,
  cuisines: String,
  rate: String, 
  rateNum: Number,
  online_order: String,
  book_table: String,
  rest_type: String,
  votes: String,
  votesNum: Number
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
