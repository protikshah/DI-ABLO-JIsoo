const fs = require("fs-extra");
const path = require("path");
const log = require("../../utils/log");

const accounts = [];
let currentIndex = 0;
let isSwitching = false;
let lastSwitch = 0;
let singleAccountRetryCount = 0;

function scanAccounts() {
  accounts.length = 0;
  const root = process.cwd();
  const files = ["account.txt", "account1.txt", "account2.txt", "account3.txt"];
  for (const f of files) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8").trim();
      if (content && content !== "[]") accounts.push(p);
    }
  }
  if (accounts.length === 0) {
    const def = path.join(root, "account.txt");
    if (!fs.existsSync(def)) fs.writeFileSync(def, "[]");
    accounts.push(def);
  }
  log.info("MULTI_ACCOUNT", `Found ${accounts.length} account file(s)`);
  return accounts;
}

function getCurrentAccount() {
  return accounts[currentIndex] || accounts[0] || path.join(process.cwd(), "account.txt");
}

function nextAccount() {
  currentIndex = (currentIndex + 1) % accounts.length;
  lastSwitch = Date.now();
  return getCurrentAccount();
}

function canSwitch() {
  return Date.now() - lastSwitch > 30000;
}

function hasMoreAccounts() {
  return accounts.length > 1;
}

function isSingleAccount() {
  return accounts.length <= 1;
}

function markCurrentAsWorking() {
  singleAccountRetryCount = 0;
}

function getRetryDelay(n) {
  return Math.min(5000 * Math.pow(1.5, n), 60000);
}

module.exports = {
  scanAccounts,
  getCurrentAccount,
  nextAccount,
  canSwitch,
  hasMoreAccounts,
  isSingleAccount,
  markCurrentAsWorking,
  getRetryDelay,
  get isSwitching() { return isSwitching; },
  set isSwitching(v) { isSwitching = v; },
  get singleAccountRetryCount() { return singleAccountRetryCount; },
  set singleAccountRetryCount(v) { singleAccountRetryCount = v; }
};
