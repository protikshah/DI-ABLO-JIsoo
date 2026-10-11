module.exports = {
  config: {
    name: "uid",
    aliases: ["id"],
    version: "1.0.0",
    author: "protik",
    countDown: 2,
    role: 0,
    description: { en: "Get Facebook UID", bn: "ফেসবুক UID দেখায়" },
    category: "info",
    guide: {
      en: "{pn}\n{pn} @mention\n{pn} (reply)",
      bn: "{pn}\n{pn} @mention\n{pn} (reply)"
    }
  },
  onStart: async function ({ api, event, args }) {
    let uid = event.senderID;
    let name = null;

    if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length) {
      uid = Object.keys(event.mentions)[0];
      name = event.mentions[uid];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    }

    try {
      if (!name) {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || "Unknown";
      }
    } catch (_) {
      name = name || "Unknown";
    }

    return api.sendMessage(
      `👤 Name: ${name}\n🆔 UID: ${uid}`,
      event.threadID,
      event.messageID
    );
  }
};
