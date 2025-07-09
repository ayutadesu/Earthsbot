if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}
// events/interactionCreate.js
const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // チケット作成ボタン処理
    if (interaction.isButton()) {
      const { guild, user, customId } = interaction;

      if (customId === 'create-ticket') {
        const existing = guild.channels.cache.find(c => c.name === `ticket-${user.id}`);
        if (existing) {
          return interaction.reply({ content: '既にチケットを作成しています。', ephemeral: true });
        }

        const channel = await guild.channels.create({
          name: `ticket-${user.username}`,
          type: ChannelType.GuildText,
          parent: config.ticketCategoryId,
          permissionOverwrites: [
            { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          ]
        });

        const closeButton = new ButtonBuilder()
          .setCustomId('close-ticket')
          .setLabel('🔒 チケットを閉じる')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await channel.send({
          content: `<@${user.id}> チケットを作成しました。管理者が対応します。`,
          components: [row]
        });

        await interaction.reply({ content: 'チケットを作成しました！', ephemeral: true });
      }

      if (customId === 'close-ticket') {
        await interaction.reply({ content: 'チケットを閉じます...', ephemeral: true });
        setTimeout(() => {
          interaction.channel.delete().catch(console.error);
        }, 3000);
      }
    }
  }
};