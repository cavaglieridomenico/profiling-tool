const { exec } = require('child_process');
const { getAdbPath } = require('./browser');

function handleTap(res, x, y, message) {
  const adbPath = getAdbPath();
  exec(`${adbPath} shell input tap ${x} ${y}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Failed to execute tap command: ${error.message}\n`);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${message}\n`);
    console.log(message);
  });
}

module.exports = { handleTap };
