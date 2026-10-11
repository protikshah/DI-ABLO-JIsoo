const mongoose = require("mongoose");
const log = require("../utils/log");

async function connectDB() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    (global.GoatBot && global.GoatBot.config && global.GoatBot.config.database && global.GoatBot.config.database.uri) ||
    "";

  if (!uri) {
    log.warn("DATABASE", "No MongoDB URI set. Set config.database.uri or env MONGODB_URI. Running without DB.");
    return null;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    log.success("DATABASE", "MongoDB connected");
    return mongoose.connection;
  } catch (err) {
    log.err("DATABASE", "MongoDB connection failed:", err.message);
    log.warn("DATABASE", "Bot will continue without persistent DB.");
    return null;
  }
}

module.exports = { connectDB };
