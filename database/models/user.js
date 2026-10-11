const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  name: String,
  gender: Number,
  money: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  data: { type: Object, default: {} },
  banned: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
