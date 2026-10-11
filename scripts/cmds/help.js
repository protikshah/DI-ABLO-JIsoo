module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands"],
    version: "1.0.0",
    author: "protik",
    countDown: 3,
    role: 0,
    description: { en: "Show command list", bn: "কমান্ড লিস্ট দেখায়" },
    category: "info",
    guide: { en: "{pn}", bn: "{pn}" }
  },
  onStart: async function ({ api, event }) {
    const prefix = global.GoatBot.config.prefix || "zx";
    const cmds = [...global.GoatBot.commands.values()];
    const lines = cmds.map((c, i) => {
      const n = c.config?.name || "?";
      const d = c.config?.description;
      const desc = typeof d === "object" ? (d.en || d.bn || "") : (d || "");
      return `${i + 1}. ${prefix}${n}${desc ? " — " + desc : ""}`;
    });
    const body =
`📖 DI-ABLO JIsoo — Commands

${lines.join("\n") || "(no commands loaded)"}

📌 Prefix: ${prefix}
➕ Add more commands in scripts/cmds/`;
    return api.sendMessage(body, event.threadID, event.messageID);
  }
};
