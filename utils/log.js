const chalk = require("chalk");

const log = {
  info: (tag, ...msg) => console.log(chalk.blue(`[${tag}]`), ...msg),
  success: (tag, ...msg) => console.log(chalk.green(`[${tag}]`), ...msg),
  warn: (tag, ...msg) => console.log(chalk.yellow(`[${tag}]`), ...msg),
  err: (tag, ...msg) => console.log(chalk.red(`[${tag}]`), ...msg),
  master: (tag, ...msg) => console.log(chalk.magenta(`[${tag}]`), ...msg),
  error: (tag, ...msg) => console.log(chalk.red(`[${tag}]`), ...msg)
};

module.exports = log;
