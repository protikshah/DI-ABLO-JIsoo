const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

async function loadImg(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 12000 });
    return await loadImage(Buffer.from(res.data));
  } catch {
    return null;
  }
}

function drawCircle(ctx, img, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    const s = Math.max((r * 2) / img.width, (r * 2) / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

async function createProfileCard({ name, uid, avatarUrl, coverUrl }) {
  const W = 900, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Cover / background avatar
  const cover = coverUrl ? await loadImg(coverUrl) : null;
  if (cover) {
    const scale = Math.max(W / cover.width, H / cover.height);
    const dw = cover.width * scale;
    const dh = cover.height * scale;
    ctx.drawImage(cover, (W - dw) / 2, (H - dh) / 2 - 40, dw, dh);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0f0a1a");
    g.addColorStop(1, "#2a1458");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay bottom
  const ov = ctx.createLinearGradient(0, H * 0.35, 0, H);
  ov.addColorStop(0, "rgba(0,0,0,0)");
  ov.addColorStop(0.45, "rgba(0,0,0,0.55)");
  ov.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);

  // Profile avatar (circle)
  const avatar = avatarUrl ? await loadImg(avatarUrl) : null;
  const cx = 160, cy = 320, r = 90;
  ctx.save();
  ctx.shadowColor = "rgba(168,85,247,0.7)";
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#e9d5ff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
  drawCircle(ctx, avatar, cx, cy, r);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Name + UID
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Sans";
  const displayName = (name || "Unknown").length > 22 ? name.slice(0, 22) + "…" : (name || "Unknown");
  ctx.fillText(displayName, 280, 310);

  ctx.fillStyle = "rgba(233,213,255,0.95)";
  ctx.font = "24px Sans";
  ctx.fillText(`UID: ${uid}`, 280, 355);

  ctx.fillStyle = "rgba(216,180,254,0.6)";
  ctx.font = "16px Sans";
  ctx.fillText("DI-ABLO JIsoo • profile", 280, 395);

  const outDir = path.join(__dirname, "cache");
  await fs.ensureDir(outDir);
  const file = path.join(outDir, `profile_${uid}_${Date.now()}.png`);
  await fs.writeFile(file, canvas.toBuffer("image/png"));
  return file;
}

module.exports = {
  config: {
    name: "profile",
    aliases: ["prof", "pp", "avt"],
    version: "1.0.0",
    author: "protik",
    countDown: 5,
    role: 0,
    description: {
      en: "Show user profile card with avatar & cover",
      bn: "ইউজার প্রোফাইল কার্ড (অ্যাভাটার + কভার)"
    },
    category: "info",
    guide: {
      en: "{pn}\n{pn} @mention\n{pn} (reply)",
      bn: "{pn}\n{pn} @mention\n{pn} (reply)"
    }
  },

  onStart: async function ({ api, event, args }) {
    let uid = event.senderID;

    if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length) {
      uid = Object.keys(event.mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    }

    let name = "Unknown";
    try {
      const info = await api.getUserInfo(uid);
      name = info[uid]?.name || "Unknown";
    } catch (_) {}

    const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    // Cover: try graph cover (may fail without token) — fallback gradient
    let coverUrl = null;
    try {
      // public profile photo as soft background alternative if no cover
      coverUrl = `https://graph.facebook.com/${uid}/picture?height=1024&width=1024&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    } catch (_) {}

    let cardPath;
    try {
      cardPath = await createProfileCard({ name, uid, avatarUrl, coverUrl });
    } catch (e) {
      return api.sendMessage("❌ Failed to create profile card: " + e.message, event.threadID, event.messageID);
    }

    return api.sendMessage(
      {
        body: `👤 ${name}\n🆔 ${uid}`,
        attachment: fs.createReadStream(cardPath)
      },
      event.threadID,
      () => {
        try { if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath); } catch (_) {}
      },
      event.messageID
    );
  }
};
