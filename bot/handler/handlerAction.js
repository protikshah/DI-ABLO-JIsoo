module.exports = function (api) {
  return async function handlerAction(event) {
    try {
      if (!event) return;

      // Event handlers (log:subscribe, log:unsubscribe, etc.)
      if (event.type === "event" || event.logMessageType) {
        const logType = event.logMessageType || event.type;
        for (const [, ev] of global.GoatBot.eventCommands) {
          const types = (ev.config && ev.config.eventType) || [];
          if (types.includes(logType) || types.length === 0) {
            if (typeof ev.onStart === "function") {
              try {
                await ev.onStart({ api, event });
              } catch (e) {
                console.error("[EVENT]", e.message);
              }
            }
          }
        }
        // also call onStart if module uses logMessageType check inside
        return;
      }

      if (event.type !== "message" && event.type !== "message_reply") return;
      if (!event.body || typeof event.body !== "string") return;

      const prefix = (global.GoatBot.config && global.GoatBot.config.prefix) || "zx";
      let body = event.body.trim();
      const isAdmin = (global.GoatBot.config.adminBot || []).map(String).includes(String(event.senderID));
      const noPrefix = global.GoatBot.config.noPrefix === true && isAdmin;

      if (!body.startsWith(prefix) && !noPrefix) return;

      let commandName, args;
      if (body.startsWith(prefix)) {
        const parts = body.slice(prefix.length).trim().split(/\s+/);
        commandName = (parts.shift() || "").toLowerCase();
        args = parts;
      } else {
        const parts = body.split(/\s+/);
        commandName = (parts.shift() || "").toLowerCase();
        args = parts;
      }

      if (!commandName) return;

      let cmd = global.GoatBot.commands.get(commandName);
      if (!cmd) {
        const alias = global.GoatBot.aliases.get(commandName);
        if (alias) cmd = global.GoatBot.commands.get(alias);
      }
      if (!cmd || typeof cmd.onStart !== "function") return;

      const role = (cmd.config && cmd.config.role) || 0;
      if (role >= 2 && !isAdmin) {
        return api.sendMessage("❌ You don't have permission to use this command.", event.threadID, event.messageID);
      }

      await cmd.onStart({
        api,
        event,
        args,
        message: {
          reply: (msg) => api.sendMessage(msg, event.threadID, event.messageID),
          send: (msg) => api.sendMessage(msg, event.threadID)
        },
        usersData: global.GoatBot.usersData,
        threadsData: global.GoatBot.threadsData,
        role: isAdmin ? 2 : 0
      });
    } catch (err) {
      console.error("[HANDLER]", err.message || err);
      try {
        api.sendMessage("❌ Command error: " + (err.message || "unknown"), event.threadID, event.messageID);
      } catch (_) {}
    }
  };
};
