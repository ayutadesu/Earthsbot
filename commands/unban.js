if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
		.setName('unban')
		.setDescription('そのユーザーの禁止を解除します ')
    .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator)
		.addUserOption(option => option.setName('対象user').setDescription('ユーザーを選択').setRequired(true))
		.addStringOption(option => option.setName('理由reason').setDescription('禁止する理由')),
	async execute(interaction, client) {
		const user = interaction.options.getUser('対象user'); //今回はユーザーを指定
		const reasons = interaction.options.getString('理由reason') || 'None'; //理由がない場合「None」
		interaction.guild.bans.remove(user.id, { reason: reasons }); //実行したサーバーでの指定したユーザーのBANを削除
		await interaction.reply('指定したユーザーのBANを解除しました/this user have unban. : ' + user.tag); //成功した際に送るメッセージ
	},
};
