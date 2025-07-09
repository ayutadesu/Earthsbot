// commands/reserve.js
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reserve')
    .setDescription('ボイスチャンネル使用ボタンを設置'),

  async execute(interaction) {
    const button = new ButtonBuilder()
      .setCustomId('voice_reserve')
      .setLabel('使用する')
      .setStyle(ButtonStyle.Primary);
    
    const button2 = new ButtonBuilder()
      .setCustomId('voice_release')
      .setLabel('退出する')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button,button2);

    await interaction.reply({
      content: 'ボイスチャンネル使用予約',
      components: [row],
    });
  },
};