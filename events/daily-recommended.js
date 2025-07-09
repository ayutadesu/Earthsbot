
// events/daily-notify.js
const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dailyNotifyChannelPath = path.join(__dirname, '..', 'config', 'dailynotify.json');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log('Daily notification system started');
    
    // 毎時チェック
    setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // 毎日午前9時に通知（分が0-5の間のみ実行して重複を防ぐ）
      if (hour !== 9 || minute > 5) return;

      if (!fs.existsSync(dailyNotifyChannelPath)) return;

      let notifyData = {};
      try {
        notifyData = JSON.parse(fs.readFileSync(dailyNotifyChannelPath, 'utf8'));
      } catch (error) {
        console.error('Error reading daily notify config:', error);
        return;
      }

      for (const guildId in notifyData) {
        const channelId = notifyData[guildId];
        
        try {
          const channel = await client.channels.fetch(channelId);
          if (!channel) continue;

          const embed = new EmbedBuilder()
            .setTitle('⏰ デイリー報酬のお知らせ')
            .setDescription('毎日のデイリー報酬を受け取るのを忘れずに！\n`/daily` コマンドを使って3000コインをゲットしよう！')
            .addFields(
              { name: '💰 報酬額', value: '3000 コイン', inline: true },
              { name: '🔄 リセット時間', value: '毎日 00:00', inline: true }
            )
            .setColor(0xFFD700)
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        } catch (error) {
          console.error(`Error sending daily notification to guild ${guildId}:`, error);
        }
      }

    }, 60 * 1000); // 1分ごとにチェック
  },
};