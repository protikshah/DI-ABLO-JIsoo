module.exports = {
  config: {
    name: "ping",
    aliases: ["p"],
    version: "1.0.0",
    author: "protik",
    countDown: 1,
    role: 0,
    description: { en: "Check bot latency", bn: "বট পিং চেক" },
    category: "info",
    guide: { en: "{pn}", bn: "{pn}" }
  },
  onStart: async function ({ api, event }) {
    const t = Date.now();
    const msg = await api.sendMessage("🏓 Pinging...", event.threadID);
    const ping = Date.now() - t;
    const uptime = global.utils.convertTime(Date.now() - global.GoatBot.startTime);
    try {
      if (msg && msg.messageID) {
        await api.unsendMessage(msg.messageID);
      }
    } catch (_) {}
    return api.sendMessage(
      `🏓 Pong!\n📶 Latency: ${ping}ms\n⏱ Uptime: ${uptime}`,
      event.threadID,
      event.messageID
    );
  }
};
