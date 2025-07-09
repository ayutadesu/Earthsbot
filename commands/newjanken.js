if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('newjanken')
		.setDescription('新じゃんけんコマンド')
    .addStringOption((option) =>
        option
        .setName('type')
        .setDescription('何を出すか選んでください')
        .setRequired(true)
    .addChoices(
          { name: '✊', value: '0' }, 
          { name: '✌', value: '1' },
          { name: "✋", value: "2"})
    )
  ,
	async execute(interaction) {
    const janken_p = interaction.options.getString('type')
    await interaction.reply({content: "じゃんけん... "})
    
		let janken = ['グー','チョキ','パー',];
		let janken_r = Math.floor( Math.random() * 2);
    var result = ""
    if (janken_r == janken_p) {
      result = "あいこだー…";
    } else if (janken_p == 0 && janken_r == 1) {
      result = "おめでとう！勝ったよ！";
    } else if (janken_p == 1 && janken_r == 2) {
      result = "おめでとう！勝ったよ！";
    } else if (janken_p == 2 && janken_r == 0) {
      result = "おめでとう！勝ったよ！";
    } else {
      result = "負けちゃったね…";
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    await interaction.editReply(`あなたは ${janken[janken_p]} でbotが${janken[janken_r]} を出したから、\n${result}`);
  }
};