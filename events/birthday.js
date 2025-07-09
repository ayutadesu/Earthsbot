
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const birthdaysPath = path.join(__dirname, 'config', 'birthdays.json');
const BIRTHDAY_CHANNEL_ID = '1388140975053996042'; // 🎯 通知を送るチャンネルIDに変更してください

module.exports = async function birthdayCheck(client) {
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (!fs.existsSync(birthdaysPath)) return;

  const birthdays = JSON.parse(fs.readFileSync(birthdaysPath, 'utf-8'));

  for (const guildId in birthdays) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const userBirthdays = birthdays[guildId];
    for (const userId in userBirthdays) {
      if (userBirthdays[userId] === todayStr) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        const channel = guild.channels.cache.get(BIRTHDAY_CHANNEL_ID);
        if (channel && channel.isTextBased()) {
          await channel.send(
            `🎉 <@${userId}>さんのお誕生日です！\nおめでとうございます🎉\n皆さんでお祝いしましょう💪`
          );
        }
      }
    }
  }
};