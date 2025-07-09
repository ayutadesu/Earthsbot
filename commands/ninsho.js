if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName('ninsho')
        .setDescription('認証ボタンを設置します')
        .addRoleOption(option => option
            .setName('role')
            .setDescription('ロールを選択してください。')
            .setRequired(true))
        .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const role = interaction.options.getRole('role');

        const button = new discord.ButtonBuilder()
            .setCustomId("verify"+role.id)
            .setLabel('認証✅')
            .setStyle(discord.ButtonStyle.Success);

        const row = new discord.ActionRowBuilder()
        .addComponents(button);
        const embed = new discord.EmbedBuilder()
        .setTitle("認証")
        .setDescription("下のボタンを押すと認証できます")
        .setFields({name:"ロール名",value:"<@&"+role+">"})
        .setColor("Green")
        await interaction.reply({ embeds:[embed], components: [row] });

    }
};