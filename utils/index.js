const log = require("./log");
const path = require("path");
const fs = require("fs-extra");

function getPrefix(threadID) {
  try {
    return (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "zx";
  } catch {
    return "zx";
  }
}

function getText(key, ...args) {
  const lang = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.language) || "en";
  const dict = global.GoatBot && global.GoatBot.languages && global.GoatBot.languages[lang];
  if (!dict) return key;
  let text = dict[key] || key;
  args.forEach((a, i) => {
    text = text.replace(new RegExp(`%${i + 1}`, "g"), a);
  });
  return text;
}

function convertTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function loadScripts(type, name, logFn, configCommands, api) {
  const dir = path.join(process.cwd(), "scripts", type === "commands" ? "cmds" : "events");
  const filePath = path.join(dir, `${name}.js`);
  try {
    delete require.cache[require.resolve(filePath)];
    const script = require(filePath);
    const config = script.config || script.module?.config || {};
    const cmdName = config.name || name;
    if (type === "commands") {
      global.GoatBot.commands.set(cmdName, script);
      if (config.aliases && Array.isArray(config.aliases)) {
        config.aliases.forEach(a => global.GoatBot.aliases.set(a, cmdName));
      }
    } else {
      global.GoatBot.eventCommands.set(cmdName, script);
    }
    return { status: "success", command: script };
  } catch (error) {
    return { status: "error", error };
  }
}

module.exports = {
  log,
  getPrefix,
  getText,
  convertTime,
  loadScripts,
  colors: { green: (t) => t, red: (t) => t, blueBright: (t) => t }
};
