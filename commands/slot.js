if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName('slot')
    .setDescription('スロットマシンを回してみよう！'),

  async execute(interaction) {
    const emojis = ['🍎',"❤","💴","7️⃣"];
    const slot1 = emojis[Math.floor(Math.random() * emojis.length)];
    const slot2 = emojis[Math.floor(Math.random() * emojis.length)];
    const slot3 = emojis[Math.floor(Math.random() * emojis.length)];

    await interaction.reply(`
**  \`___SLOTS___\`**
\` \` ❓❓❓ \` \`
  \`|         |\`
  \`|         |\`
    `);

    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
    if (slot1 === slot2 && slot2 === slot3) {
      var message='おめでとうございます！'
    } else {
      var message='残念！もう一度挑戦してみてください。'
    }

    await interaction.editReply(`
**  \`___SLOTS___\`**
\` \` ${slot1}${slot2}${slot3} \` \`
  \`|         |\`${message}
  \`|         |\`
    `);
  }
};
