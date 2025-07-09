if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const discord = require('discord.js');

module.exports = {
  data:new discord.SlashCommandBuilder()
    .setName('ping')
    .setDescription('ボットのピング値を表示します'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'ピング値', value: `${timeDiff} ms` },
        { name: 'APIレイテンシ', value: `${Math.round(interaction.client.ws.ping)} ms` }
      )
      .setColor('Green');

    await interaction.editReply({ content: ' ', embeds: [embed] });
  },
};