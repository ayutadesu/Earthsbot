// /commands/set-birthday.js

const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { updateBirthdayList } = require('../events/birthdayListManager');

const birthdaysPath = path.join(__dirname, '../config/birthdays.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-birthday')
    .setDescription('あなたの誕生日を登録します')
    .addStringOption(option =>
      option.setName('date')
        .setDescription('誕生日を MM-DD 形式で入力（例: 07-02）')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // ✅ 最初に必ず deferReply
      await interaction.deferReply({content:'あなたの誕生日を設定中…',ephemeral: true });

      const date = interaction.options.getString('date');
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      // MM-DD形式チェック
      if (!/^\d{2}-\d{2}$/.test(date)) {
        return await interaction.editReply({ content: '⚠️ 日付形式が正しくありません（MM-DD形式）' });
      }

      let data = {};
      if (fs.existsSync(birthdaysPath)) {
        data = JSON.parse(fs.readFileSync(birthdaysPath, 'utf8'));
      }

      if (!data[guildId]) data[guildId] = {};
      data[guildId][userId] = date;

      fs.writeFileSync(birthdaysPath, JSON.stringify(data, null, 2));

      // 誕生日一覧のEmbed更新
      await updateBirthdayList(interaction.client);

      await interaction.editReply({ content: `🎉 あなたの誕生日を **${date}** に登録しました！` });

    } catch (err) {
      console.error('❌ set-birthday コマンドエラー:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
      }
    }
  }
};