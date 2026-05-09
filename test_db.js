const mongoose = require('mongoose');
require('dotenv').config();

console.log("Connecting to:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
    process.exit(1);
  });
