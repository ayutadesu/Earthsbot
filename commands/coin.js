
// commands/coinadd.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getUserData, setUserData } = require('../utils/cache');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinadd')
        .setDescription('指定ユーザーにコインを追加（管理者限定）')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('対象ユーザー')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('追加するコイン数')
                .setMinValue(1)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guild.id;

        const userData = getUserData(guildId, target.id);
        userData.coins = (userData.coins || 0) + amount;
        setUserData(guildId, target.id, userData);

        const embed = new EmbedBuilder()
            .setTitle('💰 コイン追加')
            .addFields(
                { name: '👤 対象ユーザー', value: `${target.username}`, inline: true },
                { name: '➕ 追加額', value: `${amount} コイン`, inline: true },
                { name: '💳 残高', value: `${userData.coins} コイン`, inline: true }
            )
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};