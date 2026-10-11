const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");

// ★ 12 RANDOM BACKGROUNDS (same as welcome) ★
const BACKGROUNDS = [
  "https://files.catbox.moe/quguk2.jpg",
  "https://files.catbox.moe/cb9ng1.jpg",
  "https://files.catbox.moe/w0uc2p.jpg",
  "https://files.catbox.moe/ohlsa8.jpg",
  "https://files.catbox.moe/omsc7q.jpg",
  "https://files.catbox.moe/nfzy6g.jpg",
  "https://files.catbox.moe/0sexa8.jpg",
  "https://files.catbox.moe/drhqub.jpg",
  "https://files.catbox.moe/tjgv7a.jpg",
  "https://files.catbox.moe/vvrx7r.jpg",
  "https://files.catbox.moe/1x7ok3.jpg",
  "https://files.catbox.moe/y5g9cl.jpg"
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

async function createLeaveCard({ memberID, memberName, groupName, groupIconUrl, memberCount, isKicked, adminID, adminName }) {
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
    ctx.fillStyle = "#14060a";
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay (reddish for leave)
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(20,0,0,0.6)");
  overlay.addColorStop(0.5, "rgba(30,0,5,0.4)");
  overlay.addColorStop(1, "rgba(20,0,0,0.7)");
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

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const gName = groupName.length > 22 ? groupName.slice(0, 22) + "…" : groupName;
  ctx.fillText(gName, 108, 55);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText(`${memberCount} Members`, 108, 75);

  // ===== ADMIN (top-right) =====
  if (isKicked && adminID) {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText("Kicked by :", W - 105, 48);

    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 15px 'Segoe UI', sans-serif";
    const aName = adminName && adminName.length > 16 ? adminName.slice(0, 16) + "…" : (adminName || "Admin");
    ctx.fillText(aName, W - 105, 68);

    const adminAvatar = await getAvatar(adminID);
    drawCircularImage(ctx, adminAvatar, W - 65, 60, 26);
    ctx.strokeStyle = "rgba(252,165,165,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W - 65, 60, 27, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 14px 'Segoe UI', sans-serif";
    ctx.fillText("Left the group", W - 65, 65);
  }

  // ===== CENTER: "Goodbye" Text =====
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.save();
  ctx.shadowColor = "rgba(255,100,100,0.6)";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic bold 72px Georgia, serif";
  ctx.fillText(isKicked ? "Kicked" : "Goodbye", W / 2, 190);
  ctx.restore();

  // ===== MEMBER AVATAR (center) =====
  const avY = 320;
  const avR = 80;

  // Reddish glow ring
  ctx.save();
  ctx.shadowColor = "rgba(255,100,100,0.6)";
  ctx.shadowBlur = 30;
  ctx.strokeStyle = "rgba(255,150,150,0.95)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(W / 2, avY, avR + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const memberAvatar = await getAvatar(memberID);
  drawCircularImage(ctx, memberAvatar, W / 2, avY, avR);

  // Inner border
  ctx.strokeStyle = "rgba(255,200,200,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, avY, avR, 0, Math.PI * 2);
  ctx.stroke();

  // ===== MEMBER NAME =====
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic bold 42px Georgia, serif";
  const mName = memberName.length > 24 ? memberName.slice(0, 24) + "…" : memberName;
  ctx.fillText(mName, W / 2, 450);
  ctx.restore();

  // ===== WATERMARK =====
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText("© DI_ABLO", 30, H - 25);

  // Save
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cardPath = path.join(cacheDir, `leave_${memberID}_${Date.now()}.png`);
  await fs.writeFile(cardPath, canvas.toBuffer("image/png"));
  return cardPath;
}

module.exports = {
  config: {
    name: "leave",
    version: "10.0.0",
    author: "DI_ABLO",
    category: "events",
    description: "Leave/Kick Card"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const leftID = logMessageData.leftParticipantFbId;

    if (leftID === api.getCurrentUserID()) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "DI-ABLO Realm";
      const memberCount = threadInfo.participantIDs.length;
      const groupIconUrl = threadInfo.imageSrc || null;

      let memberName = "Unknown";
      try {
        const userInfo = await api.getUserInfo(leftID);
        memberName = userInfo[leftID]?.name || "Unknown";
      } catch (e) {}

      const isKicked = author && author !== leftID;
      let adminName = "Admin";
      if (isKicked) {
        try {
          const adminInfo = await api.getUserInfo(author);
          adminName = adminInfo[author]?.name || "Admin";
        } catch (e) {}
      }

      const cardPath = await createLeaveCard({
        memberID: leftID,
        memberName,
        groupName: threadName,
        groupIconUrl,
        memberCount,
        isKicked,
        adminID: isKicked ? author : null,
        adminName
      });

      await api.sendMessage(
        {
          body: isKicked
            ? `🚫 ${memberName} was removed from ${threadName}.`
            : `💔 ${memberName} left ${threadName}**.`,
          attachment: fs.createReadStream(cardPath)
        },
        threadID,
        () => { if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath); }
      );
    } catch (err) {
      console.error("Leave Error:", err);
    }
  }
};
