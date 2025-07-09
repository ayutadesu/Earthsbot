if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName('project')
    .setDescription('クリエーター一覧')
  ,
  async execute(interaction) {
    await interaction.reply('``` program:i5_xyz,papapapaaa24,\n mu_xyz. \n supporter:i5_xyz,mu_xyz. \n Thx for using Earthsbot <3``` ');
  }
};
