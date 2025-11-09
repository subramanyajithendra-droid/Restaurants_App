const fs= require('fs')
const path = require('path');
const Fastify = require('fastify');
const mongoose = require('mongoose');
const connectDB = require('./config/db')

connectDB();

const registerSwagger = require('./config/swagger');
const restaurantRoutes = require('./routes/restaurants');
const loadZomatoData = require('./services/zomatoService');
const fastifyStatic = require('@fastify/static')

const { LoadRestaurantsIntoTrie } = require('./services/TrieLoader')


// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info'
  },
});


// Load Zomato CSV and attach it to Fastify
// async function setupDependencies() {
//   const csvPath = path.join(__dirname, 'zomato.csv');
//   const zomatoData = await loadZomatoData(csvPath);

//   // Decorate Fastify with a method to get this data
//   fastify.decorate('getZomatoData', () => zomatoData);
// }

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '/public'),
  prefix: '/', // Optional: sets base URL. '/' serves as root
});

// Bootstrap function to start the server
async function startServer() {
  try {
    // await setupDependencies(); // Load data and decorate Fastify

    // ✅ Load Trie once BEFORE route registration
    await LoadRestaurantsIntoTrie();

    
    await registerSwagger(fastify); // Swagger documentation

    await fastify.register(restaurantRoutes, { prefix: '/api' }); // Mount routes

    await fastify.listen({ port: 8000, host: '0.0.0.0' }); // Start server

    console.log(`✅ Server running at http://localhost:8000`);
    console.log(`📘 Swagger docs at http://localhost:8000/docs`);
  } catch (err) {
    fastify.log.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
