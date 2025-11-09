const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Restaurant = require('./Models/restaurantModel');
const connectDB = require('./config/db')

(async () => {
  await connectDB();
  const filePath = path.join(__dirname, 'zomato.csv');
  const restaurants = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      let rateNum = 0;                                         //rate value is "NEW" in some data
      if (row.rate) {
        const parsed = parseFloat(row.rate.split('/')[0]);
        rateNum = isNaN(parsed) ? 0 : parsed;
      }

      let votesNum = 0;
      if (row.votes) {
        const parsedVotes = parseInt(row.votes.replace(/,/g, ''), 10);
        votesNum = isNaN(parsedVotes) ? 0 : parsedVotes;
      }

      restaurants.push({
        name: row.name,
        location: row.location,
        address: row.address,
        cuisines: row.cuisines,
        rate: row.rate,
        rateNum,                            // convert to number
        online_order: row.online_order,
        book_table: row.book_table,
        rest_type: row.rest_type,
        votes: row.votes,
        votesNum
      });

    })
    .on('end', async () => {
      await Restaurant.deleteMany();
      await Restaurant.insertMany(restaurants);
      console.log(`✅ Imported ${restaurants.length} restaurants`);
      process.exit();
    });
})();  
