
// commands/coincheck.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData } = require('../utils/cache');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coincheck')
        .setDescription('自分のコイン残高を確認'),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const userData = getUserData(guildId, userId);

        const embed = new EmbedBuilder()
            .setTitle('💰 コイン残高')
            .setDescription(`${interaction.user.username} さんの残高`)
            .addFields(
                { name: '💳 現在の残高', value: `${userData.coins || 0} コイン`, inline: true },
                { name: '🔥 連続ログイン', value: `${userData.dailyStreak || 0}日`, inline: true }
            )
            .setColor(0x00AE86)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};