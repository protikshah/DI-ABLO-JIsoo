const axios = require("axios");
const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");
const ytSearch = require("yt-search");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);

// ==================== CACHE MODEL ====================
const cacheSchema = new mongoose.Schema({
  cacheKey: { type: String, unique: true, required: true },
  query: { type: String, required: true },
  title: { type: String, required: true },
  catboxLink: { type: String, required: true },
  effect: { type: String, default: "none" },
  size: { type: Number, default: 0 },
  hits: { type: Number, default: 0 },
  cachedAt: { type: Date, default: Date.now }
});
const SingCache = mongoose.models.DiabloSingCache || mongoose.model("DiabloSingCache", cacheSchema);

// ==================== BASE API ====================
const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

// ==================== HELPERS ====================
function fmt(num) {
  num = Number(num) || 0;
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
  return num.toLocaleString();
}

async function downloadToFile(url, outputPath, timeout = 60000) {
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout,
    headers: { "User-Agent": "Mozilla/5.0" },
    maxContentLength: 50 * 1024 * 1024
  });
  const writer = fs.createWriteStream(outputPath);
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
    res.data.on("error", reject);
  });
}

// ★ FALLBACK: Direct download from YouTube ★
async function downloadFromYouTube(videoUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(videoUrl, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25
    });
    const writer = fs.createWriteStream(outputPath);
    stream.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    stream.on("error", reject);
    // Timeout safety
    setTimeout(() => reject(new Error("YouTube download timeout")), 90000);
  });
}

async function uploadToCatbox(filePath) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fs.createReadStream(filePath));
  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(),
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });
  return String(res.data).trim();
}

function applyAudioEffect(input, output, effect) {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(input);
    if (effect === "slowed") {
      cmd.audioFilters(["atempo=0.85", "aecho=0.8:0.88:60:0.4"]);
    } else if (effect === "bass") {
      cmd.audioFilters("bass=g=15");
    } else if (effect === "8d") {
      cmd.audioFilters(["apulsator=hz=0.125", "aecho=0.8:0.88:60:0.4"]);
    } else {
      return resolve(input);
    }
    cmd.audioCodec("libmp3lame").audioBitrate("128k").save(output)
      .on("end", () => resolve(output))
      .on("error", reject);
  });
}

// ==================== PARSE ARGS ====================
const LANG_MAP = {
  "-bangla": "bangla",
  "-hindi": "hindi",
  "-english": "english",
  "-tamil": "tamil",
  "-kpop": "kpop",
  "-punjabi": "punjabi"
};

const EFFECTS = ["-slowed", "-bass", "-8d"];

function parseArgs(args) {
  const result = { query: [], effect: "none", language: null };
  for (const arg of args) {
    const lower = arg.toLowerCase();
    if (EFFECTS.includes(lower)) result.effect = lower.replace("-", "");
    else if (LANG_MAP[lower]) result.language = LANG_MAP[lower];
    else result.query.push(arg);
  }
  return result;
}

// ★ Check if string contains non-English characters ★
function hasNonEnglish(str) {
  return /[\u0980-\u09FF\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FFF]/.test(str);
}

// ==================== MODULE ====================
module.exports = {
  config: {
    name: "sing",
    aliases: ["usong", "music9", "s9"],
    version: "3.1.0",
    author: "MahMUD | updated by DI_ABLO",
    countDown: 10,
    role: 0,
    shortDescription: "🎵 YouTube song downloader",
    category: "Media",
    guide: {
      en:
        "{p}sing9 <song name>\n" +
        "{p}sing9 -slowed <song>\n" +
        "{p}sing9 -bass <song>\n" +
        "{p}sing9 -8d <song>\n" +
        "{p}sing9 -bangla <song>\n" +
        "{p}sing9 -hindi <song>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;
    const sendMsg = (txt) => message?.reply ? message.reply(txt) : api.sendMessage(txt, threadID, messageID);

    if (!args.length) {
      return sendMsg(
        "🎵 𝗦𝗜𝗡𝗚𝟵 — 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗠𝘂𝘀𝗶𝗰\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "📌 𝗕𝗮𝘀𝗶𝗰: `!sing9 <song name>`\n\n" +
        "🎚️ 𝗔𝘂𝗱𝗶𝗼 𝗘𝗳𝗳𝗲𝗰𝘁𝘀:\n" +
        "• `-slowed` • `-bass` • `-8d`\n\n" +
        "🌍 𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲 𝗙𝗶𝗹𝘁𝗲𝗿:\n" +
        "• `-bangla` • `-hindi` • `-english`\n" +
        "• `-tamil` • `-kpop` • `-punjabi`\n\n" +
        "📌 𝗘𝘅𝗮𝗺𝗽𝗹𝗲:\n" +
        "`!sing9 -slowed moye moye`\n" +
        "`!sing9 -bangla ei ki go`"
      );
    }

    const parsed = parseArgs(args);
    const baseQuery = parsed.query.join(" ").trim();

    if (!baseQuery) return sendMsg("❌ Please provide a song name!");

    let finalQuery = baseQuery;
    if (parsed.language) finalQuery += " " + parsed.language + " song";

    const cacheKey = `${finalQuery.toLowerCase()}|${parsed.effect}`;

    // ==================== CACHE HIT ====================
    try {
      const cached = await SingCache.findOne({ cacheKey });
      if (cached) {
        await SingCache.updateOne({ _id: cached._id }, { $inc: { hits: 1 } });
        api.setMessageReaction("⚡", messageID, () => {}, true);
        const processingMsg = await message.reply("⚡ 𝗖𝗮𝗰𝗵𝗲 𝗛𝗶𝘁!");

        const cacheDir = path.join(__dirname, "cache", "sing9");
        await fs.ensureDir(cacheDir);
        const filePath = path.join(cacheDir, `cache_${Date.now()}.mp3`);

        try {
          await downloadToFile(cached.catboxLink, filePath);
          try { await message.unsend(processingMsg.messageID); } catch (e) {}
          api.setMessageReaction("✅", messageID, () => {}, true);

          return api.sendMessage({
            body:
              `🎵 𝗡𝗼𝘄 𝗣𝗹𝗮𝘆𝗶𝗻𝗴 ⚡\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `🎧 𝗧𝗶𝘁𝗹𝗲: ${cached.title}\n` +
              `🎚️ 𝗘𝗳𝗳𝗲𝗰𝘁: ${parsed.effect === "none" ? "Normal" : parsed.effect.toUpperCase()}\n` +
              `👥 𝗛𝗶𝘁𝘀: ${cached.hits + 1}`,
            attachment: fs.createReadStream(filePath)
          }, threadID, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }, messageID);
        } catch (e) {
          try { await SingCache.deleteOne({ _id: cached._id }); } catch (er) {}
        }
      }
    } catch (e) {}

    // ==================== PROCESSING ====================
    api.setMessageReaction("⏳", messageID, () => {}, true);
    const processingMsg = await message.reply(
      `🔍 𝗦𝗲𝗮𝗿𝗰𝗵𝗶𝗻𝗴...\n\n` +
      `🎵 Query: ${baseQuery}\n` +
      (parsed.effect !== "none" ? `🎚️ Effect: ${parsed.effect.toUpperCase()}\n` : "") +
      (parsed.language ? `🌍 Language: ${parsed.language}\n` : "") +
      `⏳ Please wait...`
    );

    const cacheDir = path.join(__dirname, "cache", "sing9");
    await fs.ensureDir(cacheDir);
    const rawPath = path.join(cacheDir, `raw_${Date.now()}.mp3`);
    const finalPath = path.join(cacheDir, `final_${Date.now()}.mp3`);

    let downloaded = false;
    let titleUsed = baseQuery;

    // ============ STRATEGY 1: Try HINATA API (English only) ============
    if (!hasNonEnglish(baseQuery) && !parsed.language) {
      try {
        const query = encodeURIComponent(finalQuery);
        const apiUrl = `${await mahmud()}/api/sing?q=${query}`;
        await downloadToFile(apiUrl, rawPath, 45000);
        downloaded = true;
        console.log("[sing9] Downloaded via HINATA API");
      } catch (e) {
        console.log("[sing9] HINATA API failed, trying YouTube fallback:", e.message);
      }
    }

    // ============ STRATEGY 2: YouTube fallback ============
    if (!downloaded) {
      try {
        const searchResult = await ytSearch(finalQuery);
        if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
          throw new Error("No search results");
        }

        const video = searchResult.videos[0];
        titleUsed = video.title;

        await downloadFromYouTube(video.url, rawPath);
        downloaded = true;
        console.log("[sing9] Downloaded via YouTube fallback");
      } catch (e) {
        console.error("[sing9] YouTube fallback failed:", e.message);

        // Try 2nd and 3rd results
        try {
          const searchResult = await ytSearch(finalQuery);
          for (let i = 1; i < Math.min(3, searchResult.videos.length); i++) {
            try {
              const video = searchResult.videos[i];
              titleUsed = video.title;
              await downloadFromYouTube(video.url, rawPath);
              downloaded = true;
              break;
            } catch (er) {}
          }
        } catch (er) {}
      }
    }

    // ============ BOTH FAILED ============
    if (!downloaded) {
      try { await message.unsend(processingMsg.messageID); } catch (e) {}

      // Try suggestions
      try {
        const searchResults = await ytSearch(baseQuery);
        if (searchResults && searchResults.videos && searchResults.videos.length > 0) {
          const suggestions = searchResults.videos.slice(0, 4);
          let sugTxt =
            `❌ 𝗙𝗮𝗶𝗹𝗲𝗱: ${baseQuery}\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `💡 𝗧𝗿𝘆 𝘁𝗵𝗲𝘀𝗲:\n\n`;
          for (let i = 0; i < suggestions.length; i++) {
            const v = suggestions[i];
            sugTxt += `${i + 1}. ${v.title.slice(0, 45)}\n`;
            sugTxt += `   👤 ${v.author?.name || "Unknown"} • ⏱️ ${v.timestamp}\n\n`;
          }
          sugTxt += `💬 𝗥𝗲𝗽𝗹𝘆 𝟭-𝟰`;

          const info = await message.reply(sugTxt);
          if (global.GoatBot?.onReply) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "sing9",
              messageID: info.messageID,
              author: event.senderID,
              suggestions,
              effect: parsed.effect,
              type: "suggestion"
            });
          }
          api.setMessageReaction("💡", messageID, () => {}, true);
          return info;
        }
      } catch (e) {}

      api.setMessageReaction("❌", messageID, () => {}, true);
      return sendMsg("❌ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱. Please try again.");
    }

    // ============ APPLY EFFECT ============
    let outputPath = rawPath;
    if (parsed.effect !== "none") {
      try {
        await applyAudioEffect(rawPath, finalPath, parsed.effect);
        outputPath = finalPath;
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      } catch (e) {
        console.error("Effect failed:", e.message);
      }
    }

    const fileSize = (await fs.stat(outputPath)).size;

    // ============ CACHE UPLOAD ============
    if (fileSize < 25 * 1024 * 1024) {
      try {
        const catboxLink = await uploadToCatbox(outputPath);
        await SingCache.findOneAndUpdate(
          { cacheKey },
          {
            cacheKey,
            query: finalQuery,
            title: titleUsed,
            catboxLink,
            effect: parsed.effect,
            size: fileSize
          },
          { upsert: true }
        );
      } catch (e) {
        console.error("Catbox upload failed:", e.message);
      }
    }

    try { await message.unsend(processingMsg.messageID); } catch (e) {}
    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage({
      body:
        `🎵 𝗡𝗼𝘄 𝗣𝗹𝗮𝘆𝗶𝗻𝗴\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🎧 𝗧𝗶𝘁𝗹𝗲: ${titleUsed.slice(0, 60)}\n` +
        (parsed.effect !== "none" ? `🎚️ 𝗘𝗳𝗳𝗲𝗰𝘁: ${parsed.effect.toUpperCase()}\n` : "") +
        (parsed.language ? `🌍 𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲: ${parsed.language}\n` : "") +
        `📦 𝗦𝗶𝘇𝗲: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n\n` +
        `✨ Enjoy! 🎶`,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);
  },

  // ==================== ON REPLY (Suggestion) ====================
  onReply: async function ({ api, event, Reply, message }) {
    try {
      if (!Reply || Reply.type !== "suggestion") return;
      if (String(event.senderID) !== String(Reply.author)) return;

      const num = parseInt((event.body || "").trim());
      if (isNaN(num) || num < 1 || num > Reply.suggestions.length) {
        return message.reply("❌ ɪɴᴠᴀʟɪᴅ! Reply 1-4.");
      }

      const selected = Reply.suggestions[num - 1];
      const videoUrl = selected.url;

      try { await message.unsend(Reply.messageID); } catch (e) {}
      try { if (global.GoatBot?.onReply) global.GoatBot.onReply.delete(Reply.messageID); } catch (e) {}

      const processingMsg = await message.reply(`⏳ Downloading: **${selected.title.slice(0, 40)}**...`);

      const cacheDir = path.join(__dirname, "cache", "sing9");
      await fs.ensureDir(cacheDir);
      const rawPath = path.join(cacheDir, `sug_raw_${Date.now()}.mp3`);
      const finalPath = path.join(cacheDir, `sug_final_${Date.now()}.mp3`);

      // ★ Direct YouTube download ★
      try {
        await downloadFromYouTube(videoUrl, rawPath);
      } catch (e) {
        try { await message.unsend(processingMsg.messageID); } catch (er) {}
        return message.reply(`❌ Download failed: ${e.message}`);
      }

      let outputPath = rawPath;
      if (Reply.effect && Reply.effect !== "none") {
        try {
          await applyAudioEffect(rawPath, finalPath, Reply.effect);
          outputPath = finalPath;
          if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
        } catch (e) {}
      }

      const fileSize = (await fs.stat(outputPath)).size;

      // Cache it
      const cacheKey = `${selected.title.toLowerCase()}|${Reply.effect}`;
      if (fileSize < 25 * 1024 * 1024) {
        try {
          const catboxLink = await uploadToCatbox(outputPath);
          await SingCache.findOneAndUpdate(
            { cacheKey },
            {
              cacheKey,
              query: selected.title,
              title: selected.title,
              catboxLink,
              effect: Reply.effect,
              size: fileSize
            },
            { upsert: true }
          );
        } catch (e) {}
      }

      try { await message.unsend(processingMsg.messageID); } catch (e) {}

      return api.sendMessage({
        body:
          `🎵 𝗡𝗼𝘄 𝗣𝗹𝗮𝘆𝗶𝗻𝗴\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `🎧 𝗧𝗶𝘁𝗹𝗲: ${selected.title.slice(0, 60)}\n` +
          `👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${selected.author?.name || "Unknown"}\n` +
          (Reply.effect && Reply.effect !== "none" ? `🎚️ 𝗘𝗳𝗳𝗲𝗰𝘁: ${Reply.effect.toUpperCase()}\n` : "") +
          `📦 𝗦𝗶𝘇𝗲: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n\n` +
          `✨ Enjoy! 🎶`,
        attachment: fs.createReadStream(outputPath)
      }, event.threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, event.messageID);

    } catch (err) {
      console.error("Sing9 onReply Error:", err);
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
