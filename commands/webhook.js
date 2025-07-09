if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("webhook")
    .setDescription("webhook作成")
    .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
  async execute(interaction) {
    interaction.channel.createWebhook({
	name: 'EarthsBot',
	avatar: 'https://cdn.glitch.global/2888bf70-debe-41e8-a056-0a27055d2d18/IMG_3139.png?v=1725083235553',
})
	.then(webhook => console.log(`Created webhook ${webhook}`))
	.catch(console.error);
          }
  }