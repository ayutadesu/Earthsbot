const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { pokerGames } = require('../utils/pokerGames');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poker')
    .setDescription('テキサスホールデムを開始'),

  async execute(interaction) {
    const channelId = interaction.channel.id;

    if (pokerGames.has(channelId)) {
      await interaction.reply({
        content: '❌ このチャンネルでは既にポーカーが進行中です。',
        flags: 64,
      });
      return;
    }

    const gameData = {
      hostId: interaction.user.id,
      players: [{ id: interaction.user.id, name: interaction.user.username, hand: [] }],
      status: 'waiting',
      pot: 0,
      stage: 'lobby',
    };

    pokerGames.set(channelId, gameData);

    const embed = new EmbedBuilder()
      .setTitle('♠ ポーカー ロビー')
      .setDescription('プレイヤー募集中です！\n\n' +
        `参加者: <@${interaction.user.id}>`)
      .setColor('#2ecc71');

    const joinBtn = new ButtonBuilder()
      .setCustomId('poker_join')
      .setLabel('参加する')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🃏');

    const startBtn = new ButtonBuilder()
      .setCustomId('poker_start')
      .setLabel('開始')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🚀');

    const cancelBtn = new ButtonBuilder()
      .setCustomId('poker_cancel')
      .setLabel('キャンセル')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌');

    const row = new ActionRowBuilder().addComponents(joinBtn, startBtn, cancelBtn);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};