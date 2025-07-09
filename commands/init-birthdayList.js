// commands/init-birthday-list.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const listConfigPath = path.join(__dirname, '../config', 'birthday-list.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init-birthday-list')
    .setDescription('誕生日一覧をこのチャンネルに作成します（管理者専用）'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '管理者権限が必要です。', ephemeral: true });
    }

    const config = {};
    config[interaction.guild.id] = {
      channelId: interaction.channel.id,
      messageId: null
    };

    fs.writeFileSync(listConfigPath, JSON.stringify(config, null, 2));
    await interaction.reply({ content: '✅ このチャンネルが誕生日一覧表示用に設定されました！', ephemeral: true });
  }
};