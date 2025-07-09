if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js')
module.exports = {
    data: new discord.SlashCommandBuilder()
      .setName("ban")
      .setDescription("そのユーザーをこの鯖からBANするよ！")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("BANしたいユーザーを選択してください")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("理由もあればこちらに記入してください")
          .setRequired(false)
      ),
    async execute(interaction) {
      const userToBan = interaction.options.getUser("user");
      const reason =
        interaction.options.getString("reason") || "No reason provided";

      if (!interaction.guild) {
        await interaction.reply("このサーバー内でのみ使用できます！");
        return;
      }

      if (!interaction.member.permissions.has("BAN_MEMBERS")) {
        await interaction.reply(
          "バンの権限がありません！"
        );
        return;
      }

      try {
        await interaction.guild.members.ban(userToBan, { reason });
        await interaction.reply(
          `${userToBan.tag} をBanしました。理由: ${reason}`
        );
      } catch (error) {
        console.error(error);
        await interaction.reply(
          "バン中にエラーが発生しました！"
        );
      }
    }
  }
