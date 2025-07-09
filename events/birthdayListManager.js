const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const birthdaysPath = path.join(__dirname, 'config', 'birthdays.json');
const listConfigPath = path.join(__dirname, 'config', 'birthday-list.json');

function sortByDate(obj) {
  return Object.entries(obj).sort(([, a], [, b]) => {
    const [am, ad] = a.split('-').map(Number);
    const [bm, bd] = b.split('-').map(Number);
    return am !== bm ? am - bm : ad - bd;
  });
}

async function updateBirthdayList(client) {
  if (!fs.existsSync(birthdaysPath)) return;
  const birthdayData = JSON.parse(fs.readFileSync(birthdaysPath, 'utf8'));

  let listConfig = {};
  if (fs.existsSync(listConfigPath)) {
    listConfig = JSON.parse(fs.readFileSync(listConfigPath, 'utf8'));
  }

  for (const guildId in birthdayData) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;

    const members = birthdayData[guildId];
    const sorted = sortByDate(members);
    const lines = [];

    for (const [userId, date] of sorted) {
      lines.push(`<@${userId}>：🎂 ${date}`);
    }

    const embed = new EmbedBuilder()
      .setTitle('📅 誕生日カレンダー')
      .setDescription(lines.length > 0 ? lines.join('\n') : '登録されている誕生日はありません。')
      .setColor(0xFFA500)
      .setTimestamp();

    // 一覧更新
    const conf = listConfig[guildId] || {};
    const channel = guild.channels.cache.get(conf.channelId);
    if (!channel || !channel.isTextBased()) continue;

    if (conf.messageId) {
      const msg = await channel.messages.fetch(conf.messageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
      } else {
        const sent = await channel.send({ embeds: [embed] });
        listConfig[guildId] = { channelId: channel.id, messageId: sent.id };
      }
    } else {
      const sent = await channel.send({ embeds: [embed] });
      listConfig[guildId] = { channelId: channel.id, messageId: sent.id };
    }
  }

  fs.writeFileSync(listConfigPath, JSON.stringify(listConfig, null, 2));
}

module.exports = { updateBirthdayList };