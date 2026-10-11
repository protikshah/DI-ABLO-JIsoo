# DI-ABLO JIsoo

**Messenger Bot by protik** · Powered by [fca-protik](https://github.com/protikshah/fca-protik)

A clean **GoatBot-style** Facebook Messenger bot framework — ready for **PC**, **Railway**, and **Render**.  
MongoDB · Multi-account · Cookie login · Bangla + English

---

## Features

| Feature | Status |
|---------|--------|
| Cookie / Appstate login | Yes |
| **fca-protik** FCA | Yes |
| MongoDB persistence | Yes |
| Multi-account support | Yes |
| Command system (`scripts/cmds/`) | Yes |
| Event system (`scripts/events/`) | Yes (empty — add your own) |
| Health endpoint (Railway/Render) | Yes (`/`, `/uptime`) |
| Languages | English + বাংলা |

### Built-in commands (starter)

| Command | Description |
|---------|-------------|
| `zx help` | Command list |
| `zx ping` | Latency & uptime |
| `zx uid` | Get UID (self / reply / mention) |
| `zx profile` | Profile card (avatar + background) |

Add more commands by dropping `.js` files into `scripts/cmds/`.

---

## Requirements

- **Node.js** 18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- Facebook account cookie / appstate

---

## Quick start (PC)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/DI-ABLO-JIsoo.git
cd DI-ABLO-JIsoo

# 2. Install
npm install

# 3. Cookie
#    Paste appstate JSON array into account.txt
#    Example: [{"key":"c_user","value":"..."},{"key":"xs","value":"..."}, ...]

# 4. MongoDB
#    Set in config.json → database.uri
#    OR: export MONGODB_URI="mongodb+srv://..."

# 5. Run
npm start
```

### Config highlights (`config.json`)

```json
{
  "prefix": "zx",
  "adminBot": ["100073798820230"],
  "database": {
    "type": "mongodb",
    "uri": "mongodb+srv://USER:PASS@cluster.mongodb.net/diablo"
  }
}
```

| Key | Value |
|-----|--------|
| Prefix | `zx` |
| Admin UID | `100073798820230` |
| Bot name | DI-ABLO JIsoo |

---

## Deploy on Railway

1. Push this repo to **GitHub**
2. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Variables:
   - `MONGODB_URI` = your Atlas connection string
4. Add cookie: use Railway volume or set file content via start command / secret file
5. Deploy — open the generated URL → you should see `{"status":"online","bot":"DI-ABLO JIsoo"}`

> Keep the service awake: health check path `/` or `/uptime`.

---

## Deploy on Render

1. [Render](https://render.com) → **New Web Service** → connect GitHub repo  
2. Settings:
   - **Build:** `npm install`
   - **Start:** `npm start`
3. Environment:
   - `MONGODB_URI` = Atlas URI  
   - `PORT` is set by Render automatically  
4. For cookie: upload `account.txt` via shell, or use a secret file / paste at first deploy  

---

## Multi-account

Place files in project root:

- `account.txt` (primary)
- `account1.txt`, `account2.txt`, `account3.txt` (optional)

The bot scans these on startup and can switch if one session fails.

---

## Adding commands

Create `scripts/cmds/yourcommand.js`:

```js
module.exports = {
  config: {
    name: "yourcommand",
    aliases: ["yc"],
    version: "1.0.0",
    author: "protik",
    countDown: 3,
    role: 0, // 0 = everyone, 2 = bot admin
    description: { en: "Demo", bn: "ডেমো" },
    category: "utility",
    guide: { en: "{pn}", bn: "{pn}" }
  },
  onStart: async function ({ api, event, args }) {
    return api.sendMessage("Hello from DI-ABLO JIsoo!", event.threadID, event.messageID);
  }
};
```

Restart the bot (or use your reload command if you add one).

### Adding events

Put files in `scripts/events/`. Example skeleton:

```js
module.exports = {
  config: {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    author: "protik"
  },
  onStart: async function ({ api, event }) {
    // your welcome logic
  }
};
```

---

## Project structure

```
DI-ABLO-JIsoo/
├── index.js                 # Entry
├── package.json
├── config.json              # Prefix, admin, MongoDB, FCA options
├── configCommands.json
├── account.txt              # Cookie / appstate (gitignored)
├── Procfile                 # Railway/Heroku
├── bot/
│   ├── login/login.js       # fca-protik login + banner
│   ├── login/multiAccountManager.js
│   └── handler/handlerAction.js
├── scripts/
│   ├── cmds/                # Your commands
│   └── events/              # Your events (empty by default)
├── database/
│   ├── connect.js
│   └── models/              # User, Thread (Mongoose)
├── languages/               # en.js, bn.js
└── utils/
```

---

## Security notes

- **Never commit** `account.txt` or real MongoDB passwords  
- Use **Atlas** + env `MONGODB_URI` on cloud hosts  
- Cookie accounts can be checkpointed — keep backups  

---

## Credits

- **Author:** protik  
- **Bot:** DI-ABLO JIsoo  
- **FCA:** [fca-protik](https://github.com/protikshah/fca-protik)  
- Architecture inspired by GoatBot V2 style loaders & folders  

---

## License

MIT — use, modify, host freely. Do not sell as closed “official” product without credit.

---

**DI-ABLO JIsoo** · Stay in the realm 
