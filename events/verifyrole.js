if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js')

module.exports = {
  name: discord.Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) { return; }

    const guild = interaction.guild;
    const member = guild.members.cache.get(interaction.user.id);
    const customid = interaction.customId;  // customIdからロールIDを取得
    if (customid.startsWith("verify")) {
      var roleid = customid.slice(6);
    }
    else {return;}
    const hasrole = member.roles.cache.has(roleid);
    const role = guild.roles.cache.get(roleid);
    if (hasrole) {
      const nogive = new discord.EmbedBuilder()
      .setTitle("エラー")
      .setDescription(`あなたは既に認証されています`)
      .setColor("Red")
      .setFields({name:'ロール名', value:"<@&"+role+">"})
      await interaction.reply({embeds:[nogive],ephemeral:true});
      return;
    }
    try {
    // ユーザーにロールを付与する
    await member.roles.add(roleid);
    const giverole = new discord.EmbedBuilder()
    .setTitle("認証完了")
    .setDescription("認証できました")
    .setColor("Green")
    .setFields({name:"ロール名", value:"<@&"+role+">"})
    await interaction.reply({ embeds:[giverole], ephemeral: true });
  } catch (error) {
    // エラーが出たときの処理
    await interaction.reply({
      content: `CommandExcusionError\`\`\`${error}\`\`\``,
      ephemeral: true
    })
  }
}};