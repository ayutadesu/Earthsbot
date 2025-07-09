if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("nuke")
    .setDescription("メッセージ削除")
    .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const confirm = new discord.ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('nukeしちゃう！/confirm')
            .setStyle(discord.ButtonStyle.Danger);
    const cancel = new discord.ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('やっぱやめておこうかな…/cancel')
            .setStyle(discord.ButtonStyle.Secondary);
        const row = new discord.ActionRowBuilder()
            .setComponents(confirm,cancel);
        await interaction.reply({
            content: `本当にnukeするの…？/u do nuke really??`,
            components: [row],
          });
  }
}