
// commands/set-daily-notify.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configDir = path.join(__dirname, '..', 'config');
const dailyNotifyChannelPath = path.join(configDir, 'dailynotify.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-daily-notify')
    .setDescription('デイリー通知チャンネルを設定します')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('通知を送信するチャンネル')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    // configディレクトリが存在しない場合は作成
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    let notifyData = {};
    if (fs.existsSync(dailyNotifyChannelPath)) {
      try {
        notifyData = JSON.parse(fs.readFileSync(dailyNotifyChannelPath, 'utf8'));
      } catch (error) {
        console.error('Error reading daily notify config:', error);
      }
    }

    notifyData[interaction.guild.id] = channel.id;

    try {
      fs.writeFileSync(dailyNotifyChannelPath, JSON.stringify(notifyData, null, 2));
      
      const embed = new EmbedBuilder()
        .setTitle('✅ 設定完了')
        .setDescription(`デイリー通知チャンネルを ${channel} に設定しました！`)
        .setColor(0x00FF00);
        
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error saving daily notify config:', error);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ エラー')
        .setDescription('設定の保存中にエラーが発生しました。')
        .setColor(0xFF0000);
        
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
