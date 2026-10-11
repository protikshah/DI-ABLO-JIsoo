const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema({
  threadID: { type: String, required: true, unique: true },
  threadName: String,
  members: { type: Array, default: [] },
  adminIDs: { type: Array, default: [] },
  data: { type: Object, default: {} },
  settings: { type: Object, default: {} },
  banned: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.models.Thread || mongoose.model("Thread", threadSchema);
