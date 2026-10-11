const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");

// ★ 12 RANDOM BACKGROUNDS ★
const BACKGROUNDS = [
  "https://files.catbox.moe/mkivok.jpg",
  "https://files.catbox.moe/ipp6k9.jpg",
  "https://files.catbox.moe/dl5z5t.jpg",
  "https://files.catbox.moe/myhp7h.jpg",
  "https://files.catbox.moe/ks05kz.jpg",
  "https://files.catbox.moe/lk1ea8.jpg",
  "https://files.catbox.moe/o40lgf.jpg",
  "https://files.catbox.moe/o2tzw5.jpg",
  "https://files.catbox.moe/exwb1f.jpg",
  "https://files.catbox.moe/n59loz.jpg",
  "https://files.catbox.moe/q47gol.jpg",
  "https://files.catbox.moe/cnjfq6.jpg"
];

async function loadImageFromUrl(url, timeout = 8000) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout });
    return await loadImage(Buffer.from(res.data));
  } catch (e) {
    return null;
  }
}

async function getAvatar(uid) {
  if (!uid) return null;
  try {
    const url = `https://graph.facebook.com/${uid}/picture?height=300&width=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    return await loadImageFromUrl(url, 6000);
  } catch (e) {
    return null;
  }
}

function drawCircularImage(ctx, img, cx, cy, radius) {
  if (!img) {
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

async function createWelcomeCard({ memberID, memberName, groupName, groupIconUrl, memberCount, adderID, adderName }) {
  const W = 900, H = 560;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ===== BACKGROUND =====
  const bgUrl = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
  const bgImg = await loadImageFromUrl(bgUrl);
  if (bgImg) {
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const dw = bgImg.width * scale;
    const dh = bgImg.height * scale;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay for text readability
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(0,0,0,0.55)");
  overlay.addColorStop(0.5, "rgba(0,0,0,0.35)");
  overlay.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // ===== GROUP ICON (top-left) =====
  const groupIcon = groupIconUrl ? await loadImageFromUrl(groupIconUrl, 6000) : null;
  drawCircularImage(ctx, groupIcon, 70, 60, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(70, 60, 27, 0, Math.PI * 2);
  ctx.stroke();

  // Group name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const gName = groupName.length > 22 ? groupName.slice(0, 22) + "…" : groupName;
  ctx.fillText(gName, 108, 55);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText(`${memberCount} Members`, 108, 75);

  // ===== ADDER (top-right) =====
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText("Added by :", W - 105, 48);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px 'Segoe UI', sans-serif";
  const aName = adderName && adderName.length > 16 ? adderName.slice(0, 16) + "…" : (adderName || "Unknown");
  ctx.fillText(aName, W - 105, 68);

  const adderAvatar = await getAvatar(adderID);
  drawCircularImage(ctx, adderAvatar, W - 65, 60, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W - 65, 60, 27, 0, Math.PI * 2);
  ctx.stroke();

  // ===== CENTER: "Welcome" Text =====
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Glow behind Welcome
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic bold 72px Georgia, serif";
  ctx.fillText("Welcome", W / 2, 190);
  ctx.restore();

  // ===== MEMBER AVATAR (center) =====
  const avY = 320;
  const avR = 80;

  // Outer glow ring
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,0.5)";
  ctx.shadowBlur = 30;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(W / 2, avY, avR + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const memberAvatar = await getAvatar(memberID);
  drawCircularImage(ctx, memberAvatar, W / 2, avY, avR);

  // Inner border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, avY, avR, 0, Math.PI * 2);
  ctx.stroke();

  // ===== MEMBER NAME (below avatar) =====
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic bold 42px Georgia, serif";
  const mName = memberName.length > 24 ? memberName.slice(0, 24) + "…" : memberName;
  ctx.fillText(mName, W / 2, 450);
  ctx.restore();

  // ===== WATERMARK (bottom-left) =====
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText("© DI_ABLO", 30, H - 25);

  // Save
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cardPath = path.join(cacheDir, `welcome_${memberID}_${Date.now()}.png`);
  await fs.writeFile(cardPath, canvas.toBuffer("image/png"));
  return cardPath;
}

module.exports = {
  config: {
    name: "welcome",
    version: "10.0.0",
    author: "DI_ABLO",
    category: "events",
    description: "🌟Welcome Card"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData, author } = event;
    const addedParticipants = logMessageData.addedParticipants;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "DI-ABLO Realm";
      const memberCount = threadInfo.participantIDs.length;
      const groupIconUrl = threadInfo.imageSrc || null;

      let adderName = "Unknown";
      if (author) {
        try {
          const adderInfo = await api.getUserInfo(author);
          adderName = adderInfo[author]?.name || "Unknown";
        } catch (e) {}
      }

      for (const user of addedParticipants) {
        const userID = user.userFbId;
        const userName = user.fullName;
        const isSelfJoin = !author || author === userID;

        let cardPath;
        try {
          cardPath = await createWelcomeCard({
            memberID: userID,
            memberName: userName,
            groupName: threadName,
            groupIconUrl,
            memberCount,
            adderID: isSelfJoin ? null : author,
            adderName: isSelfJoin ? "Self Join" : adderName
          });
        } catch (e) {
          console.error("Welcome card error:", e);
          continue;
        }

        await api.sendMessage(
          {
            body: `✨ ${userName} joined ${threadName}!`,
            attachment: fs.createReadStream(cardPath)
          },
          threadID,
          () => { if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath); }
        );
      }
    } catch (err) {
      console.error("Welcome Error:", err);
    }
  }
};
