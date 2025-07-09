if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const messageId = interaction.message.id;
    const buttonMap = config.roleButtons?.[messageId];
    if (!buttonMap) return;

    const roleId = buttonMap[interaction.customId];
    if (!roleId) return;

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      await interaction.reply({ content: `❎ ロールを削除しました`, ephemeral: true });
    } else {
      await member.roles.add(roleId);
      await interaction.reply({ content: `✅ ロールを付与しました`, ephemeral: true });
    }
  }
};
