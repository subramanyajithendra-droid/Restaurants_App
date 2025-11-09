// src/config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/zomato')
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection failed", err);
    process.exit(1);
  }
}

module.exports = connectDB;
