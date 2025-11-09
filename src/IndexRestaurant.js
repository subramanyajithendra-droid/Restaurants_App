const mongoose = require('mongoose')
const Restaurant = require('./Models/restaurantModel')
const esClient = require('./elasticSearch')
const connectDB = require('./config/db')


async function indexRestaurants() {
    await connectDB();

    try {
        const restaurants = await Restaurant.find();
        console.log(`Found ${restaurants.length} restaurants in MongoDB.`);

        for( let rest of restaurants) {
            await esClient.index({
                index: 'restaurants',
                id: rest._id.toString(),
                document: {
                    name: rest.name,
                    location: rest.location,
                    address: rest.address,
                    cuisines: rest.cuisines,
                    rateNum: rest.rateNum,
                    online_order: rest.online_order,
                    book_table: rest.book_table,
                    rest_type: rest.rest_type,
                    votesNum: rest.votesNum,
                    rate: rest.rate,
                    votes: rest.votes
                }
            })
        }
        console.log('✅ Indexed all restaurants into Elasticsearch!');         
        process.exit();                                  //for checking data in elasticsearch --> http://localhost:9200/restaurants/_count?pretty
    } catch (err) {
        console.error('❌ Error indexing restaurants:', err);
        process.exit(1);
    }
}

indexRestaurants();