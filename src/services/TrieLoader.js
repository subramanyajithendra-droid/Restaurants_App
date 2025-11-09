const Restaurant = require('../Models/restaurantModel');
const { Trie } = require('../services/Trie');

// ✅ Shared Trie instance
const RestaurantTrie = new Trie();

async function LoadRestaurantsIntoTrie() {
  try {
    // 🔹 Fetch full restaurant fields
    const allRestaurants = await Restaurant.find(
      {},
      {
        name: 1,
        location: 1,
        address: 1,
        cuisines: 1,
        rateNum: 1,
        online_order: 1,
        book_table: 1,
        rest_type: 1,
        votesNum: 1,
        rate: 1,
        votes: 1
      }
    ).lean();

    allRestaurants.forEach(r => {
      if (!r || !r.name) return;

      const restaurantData = {
        _id: r._id?.toString(),
        name: r.name,
        location: r.location || '',
        address: r.address || '',
        cuisines: r.cuisines || '',
        rateNum: r.rateNum || 0,
        rate: r.rate || '',
        votesNum: r.votesNum || 0,
        votes: r.votes || '',
        online_order: r.online_order || false,
        book_table: r.book_table || false,
        rest_type: r.rest_type || '',
        type: 'restaurant'
      };

      // 🔹 Insert full name
      RestaurantTrie.insert(r.name.toLowerCase(), restaurantData);

      // 🔹 Insert words from name
      const words = r.name.split(/\s+/);
      words.forEach(word => {
        if (word.trim().length > 1) {
          RestaurantTrie.insert(word.toLowerCase(), restaurantData);
        }
      });

      // 🔹 Insert cuisines
      if (r.cuisines) {
        const cuisines = r.cuisines.split(/,\s*/);
        cuisines.forEach(cuisine => {
          if (cuisine.trim().length > 1) {
            const cuisineData = {
              name: cuisine.trim(),
              type: 'cuisine'
            };
            RestaurantTrie.insert(cuisine.toLowerCase(), cuisineData);
          }
        });
      }
    });

    console.log(`✅ Trie loaded with ${allRestaurants.length} restaurants`);
  } catch (err) {
    console.error('❌ Error loading restaurants into Trie:', err);
  }
}

module.exports = { RestaurantTrie, LoadRestaurantsIntoTrie };
