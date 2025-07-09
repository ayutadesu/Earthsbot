if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrolebutton')
    .setDescription('既存のロールパネルにボタンを追加します')
    .addStringOption(option =>
      option.setName('メッセージid')
        .setDescription('対象のロールパネルのメッセージID')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('ロール')
        .setDescription('付与するロール')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('ラベル')
        .setDescription('ボタンに表示する文字')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: 'このコマンドを使うには「ロールの管理」権限が必要です。', ephemeral: true });
    }

    const messageId = interaction.options.getString('メッセージid');
    const role = interaction.options.getRole('ロール');
    const label = interaction.options.getString('ラベル');

    let message;
    try {
      message = await interaction.channel.messages.fetch(messageId);
    } catch (err) {
      return interaction.reply({ content: '指定されたメッセージが見つかりません。', ephemeral: true });
    }

    // 既存のボタン行を読み取り
    const existingRow = message.components[0];
    if (!existingRow || !existingRow.components) {
      return interaction.reply({ content: 'そのメッセージにはボタンが含まれていません。', ephemeral: true });
    }

    if (existingRow.components.length >= 5) {
      return interaction.reply({ content: 'このボタン行は既に最大数（5個）に達しています。', ephemeral: true });
    }

    // 新しい ActionRowBuilder を作成し、既存ボタンを追加
    const newRow = new ActionRowBuilder();
    for (const component of existingRow.components) {
      newRow.addComponents(ButtonBuilder.from(component));
    }

    // 新しいボタンを追加
    const customId = `role_button_${role.id}`;
    const newButton = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary);

    newRow.addComponents(newButton);

    // メッセージを更新
    await message.edit({ components: [newRow] });

    // 保存データを更新
    config.roleButtons = config.roleButtons || {};
    config.roleButtons[message.id] = config.roleButtons[message.id] || {};
    config.roleButtons[message.id][customId] = role.id;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply({ content: '✅ ボタンを追加しました！', ephemeral: true });
  }
};
