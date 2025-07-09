const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'settings.json');

function getSettings() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ featureEnabled: false }, null, 2));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function setSettings(newSettings) {
  fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2));
}

module.exports = { getSettings, setSettings };