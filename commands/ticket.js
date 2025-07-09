if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("ticketパネルを作成します。")
    .addStringOption(option => option
      .setName('description')
      .setDescription('パネルの説明を設定できます'))
    .addStringOption(option => option
      .setName('title')
      .setDescription('パネルの題名を設定できます')),  
  async execute(interaction, client) {
     const { options } = interaction;
    let title = "ticketパネル";
    let description = "チケットを作成したい場合はチケットを作成する！ボタンを押してください。";

    const setumeiOption = options.getString('description');
    const daimeiOption = options.getString('title');

    if (setumeiOption) {
      description = setumeiOption;
    } 

    if (daimeiOption) {
      title = daimeiOption;
    }

            const ticketButton = new discord.ButtonBuilder()
            .setCustomId("create-ticket")
            .setLabel('チケットを作成する！🎫')
            .setStyle(discord.ButtonStyle.Success);

    const actionRow = new discord.ActionRowBuilder()
      .addComponents([ticketButton])

    const embed = new discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor("Yellow")
        await interaction.reply({ embeds:[embed], components: [actionRow] });
  }
};
