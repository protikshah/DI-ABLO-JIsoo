/**
 * DI-ABLO JIsoo — Entry point
 * Author: protik | FCA: fca-protik
 */
const path = require("path");
const fs = require("fs-extra");

process.on("unhandledRejection", (err) => {
  console.error("[UNHANDLED_REJECTION]", err && (err.stack || err.message || err));
});
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT]", err && (err.stack || err.message || err));
});

// Global bootstrap (GoatBot-compatible)
global.GoatBot = {
  startTime: Date.now(),
  commands: new Map(),
  eventCommands: new Map(),
  aliases: new Map(),
  onChat: [],
  onEvent: [],
  onReply: new Map(),
  onReaction: new Map(),
  config: {},
  configCommands: {},
  languages: {},
  fcaApi: null,
  botID: null,
  Listening: null
};

global.client = {
  dirConfig: path.join(process.cwd(), "config.json"),
  dirConfigCommands: path.join(process.cwd(), "configCommands.json"),
  dirAccount: path.join(process.cwd(), "account.txt")
};

global.utils = require("./utils");

// Load config
try {
  global.GoatBot.config = require("./config.json");
} catch (e) {
  console.error("Failed to load config.json", e.message);
  process.exit(1);
}

try {
  global.GoatBot.configCommands = require("./configCommands.json");
} catch (_) {
  global.GoatBot.configCommands = {};
}

// Start login
require("./bot/login/login.js")();
