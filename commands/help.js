if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');
const fs = require('fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName('help')
    .setDescription('コマンド一覧を表示します')
  ,
  async execute(interaction) {
     let str = ''; // str を初期化する
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./${file}`);
    if (!command.data || !command.data.name || !command.data.description) continue; // dataが無い場合スキップ
    str += `${command.data.name}: ${command.data.description} \n`;
}
    const button = new discord.ButtonBuilder()
	.setLabel('制作者のサーバーに入る')
	.setURL('https://discord.gg/HaHBwQYhRD')
	.setStyle(ButtonStyle.Link);
    const bts = new discord.ButtonBuilder()
	.setLabel('botを自分の鯖に入れてみる！')
	.setURL('https://discord.com/oauth2/authorize?client_id=1206698689964539954&permissions=0&scope=bot')
	.setStyle(ButtonStyle.Link);

    const row = new discord.ActionRowBuilder()
            .setComponents(bts,button);
    const embed = new discord.EmbedBuilder()
    .setColor("Green")
    .setTitle("help")
    .setDescription(str)
    await interaction.reply({embeds:[embed],components: [row]});
  }
};
