if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('osirase')
    .setDescription('設定されたお知らせチャンネルにEmbedでお知らせを送信します'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('osiraseModal')
      .setTitle('お知らせを送信');

    const contentInput = new TextInputBuilder()
      .setCustomId('osiraseContent')
      .setLabel('お知らせ内容')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('ここにお知らせ内容を入力してください')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(contentInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
};
