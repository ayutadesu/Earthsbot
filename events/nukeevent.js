if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  name: discord.Events.InteractionCreate,
  async execute(interaction) {
    const customid = interaction.customId;
    if (customid === "confirm") {
      const channel = await interaction.channel.clone()
      channel.send("☢️ nukeしたよ！本当に良かったの…？/Nuked!! But,was it really good?☢️");
      channel.send({ files: ['https://cdn.glitch.global/2888bf70-debe-41e8-a056-0a27055d2d18/e10cac48-3be5-46f8-a36b-c432dac49ce3.image.gif?v=1708181379946'] })
      channel.setPosition(interaction.channel.position);
      interaction.channel.delete();
    }
    else if (customid === "cancel"){
      await interaction.update({ content: 'キャンセルしました…ホントにしたかったの…？', components: [] });
    }
    else{return;}
}};