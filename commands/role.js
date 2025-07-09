if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName('role')
    .setDescription('ボタン式ロールパネルを作成します')
    .addRoleOption(option => option.setName('ロール1').setDescription('付与するロール1').setRequired(true))
    .addStringOption(option => option.setName('ラベル1').setDescription('ボタンに表示するテキスト1').setRequired(true))
    .addRoleOption(option => option.setName('ロール2').setDescription('付与するロール2').setRequired(false))
    .addStringOption(option => option.setName('ラベル2').setDescription('ボタンに表示するテキスト2').setRequired(false))
    .addRoleOption(option => option.setName('ロール3').setDescription('付与するロール3').setRequired(false))
    .addStringOption(option => option.setName('ラベル3').setDescription('ボタンに表示するテキスト3').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(discord.PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: 'このコマンドを使うには「ロールの管理」権限が必要です。', ephemeral: true });
    }

    const roles = [];
    for (let i = 1; i <= 3; i++) {
      const role = interaction.options.getRole(`ロール${i}`);
      const label = interaction.options.getString(`ラベル${i}`);
      if (role && label) {
        roles.push({ role, label });
      }
    }

    if (roles.length === 0) {
      return interaction.reply({ content: '少なくとも1つのロールとラベルが必要です。', ephemeral: true });
    }

    const embed = new discord.EmbedBuilder()
      .setTitle('ロール選択パネル')
      .setDescription('以下のボタンを押すと、対応するロールが付与または削除されます。')
      .setColor(0x00AE86);

    const row = new discord.ActionRowBuilder();

    const buttonMap = {};

    for (const { role, label } of roles) {
      const customId = `role_button_${role.id}`;
      row.addComponents(
        new discord.ButtonBuilder()
          .setCustomId(customId)
          .setLabel(label)
          .setStyle(discord.ButtonStyle.Primary)
      );
      buttonMap[customId] = role.id;
    }

    const message = await interaction.channel.send({ embeds: [embed], components: [row] });

    // 保存（メッセージID → カスタムID → ロールID）
    config.roleButtons = config.roleButtons || {};
    config.roleButtons[message.id] = buttonMap;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply({ content: '✅ ボタン式ロールパネルを作成しました！', ephemeral: true });
  }
};
