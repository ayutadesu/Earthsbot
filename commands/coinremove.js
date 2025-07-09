
// commands/coinremove.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getUserData, setUserData } = require('../utils/cache');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinremove')
        .setDescription('指定ユーザーのコインを減らす（管理者限定）')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('対象ユーザー')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('減らすコイン数')
                .setMinValue(1)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guild.id;

        const userData = getUserData(guildId, target.id);
        const previousCoins = userData.coins || 0;
        userData.coins = Math.max(0, previousCoins - amount);
        const actualRemoved = previousCoins - userData.coins;
        
        setUserData(guildId, target.id, userData);

        const embed = new EmbedBuilder()
            .setTitle('💰 コイン減算')
            .addFields(
                { name: '👤 対象ユーザー', value: `${target.username}`, inline: true },
                { name: '➖ 減算額', value: `${actualRemoved} コイン`, inline: true },
                { name: '💳 残高', value: `${userData.coins} コイン`, inline: true }
            )
            .setColor(0xFF6B6B)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};