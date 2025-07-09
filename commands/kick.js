if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
		.setName('kick')
		.setDescription('そのメンバーをサーバーから追放します。')
      .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator)
		.addUserOption(option => option.setName('対象user').setDescription('メンバーを選択').setRequired(true))
		.addStringOption(option => option.setName('理由reason').setDescription('追放する理由')),
	async execute(interaction, client) {
		const user = interaction.options.getMember('対象user'); //今回はメンバーを指定
		const reasons = interaction.options.getString('理由reason') || 'None'; //理由がない場合「None」
		user.kick({ reason: reasons }); //指定したメンバーをKICK
		await interaction.reply('指定したユーザーをKICKしました this user have kick ' + user.tag);//成功した際に送るメッセージ
	},
};
