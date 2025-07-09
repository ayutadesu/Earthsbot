
// commands/ranking.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cache = require('../utils/cache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coin-ranking')
    .setDescription('コインのランキングを表示します'),
  
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const serverData = cache.get(guildId) || {};

    const rankings = Object.entries(serverData)
      .filter(([, data]) => data && typeof data.coins === 'number')
      .sort(([, a], [, b]) => (b.coins || 0) - (a.coins || 0))
      .slice(0, 10);

    if (rankings.length === 0) {
      return interaction.reply('ランキングデータが存在しません。');
    }

    const embedDescription = rankings.map(([userId, data], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}位`;
      return `${medal} <@${userId}>：${data.coins || 0} コイン`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🏆 コインランキング TOP10')
      .setDescription(embedDescription)
      .setColor(0x00AE86)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};