if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName('update')
    .setDescription('現在のupdate情報を表示します')
    .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator)
  ,
  async execute(interaction) {
      interaction.reply({content:"取得中です…",ephemeral:true})
          const embed = new discord.EmbedBuilder()
        .setTitle("EarthsBotV3.1 修正パッチ情報")
        .setDescription("server enable disable list コマンドを使用した際に生じたバグを修正しました。 要望があれば papapapaaa24にご相談ください。")
        .setColor("Green")
        await interaction.channel.send({ embeds:[embed]})
      }
    }