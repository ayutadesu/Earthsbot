if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require("discord.js");
const axios = require('axios');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName('kinro')
    .setDescription('金曜ロードショーについての情報を取得します'),
  async execute(interaction) {
    // 金曜ロードショーのAPIエンドポイント
    const kinroApiUrl = 'https://kinro-api.vercel.app';

    // APIからデータを取得
    const response = await axios.get(kinroApiUrl);
    const kinroData = response.data;

    // メッセージの埋め込みを作成
    const embed = new discord.EmbedBuilder()
      .setTitle(kinroData.title)
      .setDescription(`放送予定時刻: ${kinroData.broadcastStartTime}`)
      .setColor('#00FF00')
      .setImage(kinroData.imageUrl);

    // メッセージとして返信
    await interaction.reply({ embeds: [embed] });
  }
};
