process.stdout.write("\x1b]2;DI-ABLO JIsoo | by protik\x1b\x5c");

const fs = require("fs-extra");
const path = require("path");
const gradient = require("gradient-string");
const express = require("express");
const http = require("http");

const log = require("../../utils/log");
const multiAccountManager = require("./multiAccountManager");
const { connectDB } = require("../../database/connect");

function centerText(text, length) {
  const width = process.stdout.columns || 80;
  const len = length || text.length;
  const left = Math.max(0, Math.floor((width - len) / 2));
  console.log(" ".repeat(left) + text);
}

function createLine(content) {
  const w = Math.min(process.stdout.columns || 50, 50);
  if (!content) return "─".repeat(w);
  const c = ` ${content} `;
  const side = Math.max(0, Math.floor((w - c.length) / 2));
  return "─".repeat(side) + c + "─".repeat(side);
}

function parseAppState(raw) {
  raw = (raw || "").trim();
  if (!raw || raw === "[]") throw new Error("account.txt is empty. Paste your cookie/appstate JSON.");

  // EAAAA token
  if (raw.startsWith("EAAAA")) {
    throw new Error("Token login not configured in this build. Use cookie JSON array.");
  }

  // Cookie string: c_user=...; xs=...
  if (/^(?:\s*\w+\s*=\s*[^;]*;?)+/.test(raw) && !raw.startsWith("[")) {
    return raw.split(";")
      .map(i => {
        const [key, ...rest] = i.split("=");
        return {
          key: (key || "").trim(),
          value: (rest.join("=") || "").trim(),
          domain: "facebook.com",
          path: "/",
          hostOnly: false
        };
      })
      .filter(i => i.key && i.value);
  }

  // JSON appstate
  let data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Appstate must be a JSON array");
  return data.map(item => {
    if (item.name && !item.key) {
      item.key = item.name;
      delete item.name;
    }
    return {
      key: item.key,
      value: item.value,
      domain: item.domain || "facebook.com",
      path: item.path || "/",
      hostOnly: !!item.hostOnly
    };
  }).filter(i => i.key && i.value);
}

function loadCommands() {
  const dir = path.join(process.cwd(), "scripts", "cmds");
  fs.ensureDirSync(dir);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
  let count = 0;
  for (const file of files) {
    try {
      const full = path.join(dir, file);
      delete require.cache[require.resolve(full)];
      const script = require(full);
      const config = script.config || {};
      const name = config.name || file.replace(".js", "");
      global.GoatBot.commands.set(name, script);
      if (Array.isArray(config.aliases)) {
        config.aliases.forEach(a => global.GoatBot.aliases.set(String(a).toLowerCase(), name));
      }
      count++;
    } catch (e) {
      log.err("COMMAND", `Failed to load ${file}:`, e.message);
    }
  }
  return count;
}

function loadEvents() {
  const dir = path.join(process.cwd(), "scripts", "events");
  fs.ensureDirSync(dir);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") && !f.endsWith(".eg.js"));
  let count = 0;
  for (const file of files) {
    try {
      const full = path.join(dir, file);
      delete require.cache[require.resolve(full)];
      const script = require(full);
      const config = script.config || script.module?.exports?.config || {};
      // support both module.exports = { config, onStart } and module.exports.config
      const name = (script.config && script.config.name) || file.replace(".js", "");
      global.GoatBot.eventCommands.set(name, script);
      count++;
    } catch (e) {
      log.err("EVENT", `Failed to load ${file}:`, e.message);
    }
  }
  return count;
}

function startUptimeServer() {
  const cfg = global.GoatBot.config.serverUptime || {};
  if (cfg.enable === false) return;
  const port = process.env.PORT || cfg.port || 3000;
  const app = express();
  app.get("/", (req, res) => {
    res.json({
      status: "online",
      bot: "DI-ABLO JIsoo",
      uptime: process.uptime(),
      author: "protik"
    });
  });
  app.get("/uptime", (req, res) => {
    res.json({ status: "success", uptime: process.uptime(), unit: "seconds" });
  });
  http.createServer(app).listen(port, () => {
    log.info("UPTIME", `Health server on port ${port} (Railway/Render ready)`);
  });
}

async function startBot() {
  const { login } = require("fca-protik");

  // Banner
  console.log(gradient("#FA8BFF", "#2BD2FF")(createLine()));
  const title = "DI-ABLO JIsoo";
  centerText(gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(title), title.length);
  const sub = "Messenger Bot by protik | Powered by fca-protik";
  centerText(gradient("#9F98E8", "#AFF6CF")(sub), sub.length);
  centerText(gradient("#f5af19", "#f12711")("© DI-ABLO JIsoo"), 16);
  console.log(gradient("#FA8BFF", "#2BD2FF")(createLine()));

  multiAccountManager.scanAccounts();
  const accountPath = multiAccountManager.getCurrentAccount();
  global.client.dirAccount = accountPath;
  log.info("MULTI_ACCOUNT", `Using: ${path.basename(accountPath)}`);

  let appState;
  try {
    const raw = fs.readFileSync(accountPath, "utf8");
    appState = parseAppState(raw);
  } catch (e) {
    log.err("LOGIN", e.message);
    log.warn("LOGIN", "Put your cookie/appstate JSON in account.txt then restart.");
    process.exit(1);
  }

  log.info("LOGIN", "Logging in with cookie/appstate...");

  login({ appState }, async (err, api) => {
    if (err) {
      log.err("LOGIN", err.error || err.message || err);
      process.exit(1);
    }

    try {
      const opts = global.GoatBot.config.optionsFca || {};
      api.setOptions(opts);
    } catch (_) {}

    global.GoatBot.fcaApi = api;
    global.GoatBot.botID = api.getCurrentUserID();
    multiAccountManager.markCurrentAsWorking();

    log.success("LOGIN", `Logged in as ${global.GoatBot.botID}`);

    // MongoDB
    await connectDB();

    // Lightweight data helpers
    global.GoatBot.usersData = {
      getName: async (uid) => {
        try {
          const info = await api.getUserInfo(uid);
          return info[uid]?.name || "Unknown";
        } catch {
          return "Unknown";
        }
      },
      get: async () => ({}),
      set: async () => {}
    };
    global.GoatBot.threadsData = {
      get: async () => ({}),
      set: async () => {}
    };

    // Load scripts
    const cmdCount = loadCommands();
    const evCount = loadEvents();
    log.success("LOADER", `Commands: ${cmdCount} | Events: ${evCount}`);

    // Languages
    try {
      global.GoatBot.languages.en = require("../../languages/en.js");
      global.GoatBot.languages.bn = require("../../languages/bn.js");
    } catch (_) {}

    // Admin list
    const admins = global.GoatBot.config.adminBot || [];
    log.master("ADMIN", admins.join(", ") || "(none)");
    log.master("PREFIX", global.GoatBot.config.prefix || "zx");
    log.master("SUCCESS", "DI-ABLO JIsoo is ONLINE");

    // Uptime for Railway/Render
    startUptimeServer();

    // Listen
    const handler = require("../handler/handlerAction.js")(api);

    const listenCb = (error, event) => {
      if (error) {
        if (
          error.error === "Not logged in" ||
          error.error === "Not logged in." ||
          (error.error && String(error.error).includes("logout"))
        ) {
          log.err("LISTEN", "Account issue:", error.error || error);
          return;
        }
        if (error === "Connection closed." || error === "Connection closed by user.") return;
        log.err("LISTEN", error.error || error.message || error);
        return;
      }
      handler(event);
    };

    global.GoatBot.Listening = api.listenMqtt(listenCb);
    log.success("LISTEN", "MQTT listener started");
  });
}

module.exports = startBot;
