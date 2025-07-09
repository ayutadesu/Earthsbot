if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require( 'discord.js');
// パスはプロジェクトの構造に合わせて適切に変更してください

 module.exports= {
  name: discord.Events.ClientReady,
  async execute(client) {
    console.log('EarthsBotは更新されました!!');
  }
}
// interactionCreate.js (ボタン部分のみ抜粋)
const reservationQueue = new Map();

discord.client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'voice_reserve') {
    const guild = interaction.guild;
    const member = interaction.member;
    const voiceChannel = guild.channels.cache.get('1391804372479901786'); // ←対象VCのIDに置き換え

    if (!voiceChannel) return interaction.reply({ content: 'VCが見つかりません', ephemeral: true });

    const queueData = reservationQueue.get(guild.id) || { queue: [], current: null };

    if (queueData.current === null) {
      // 使用中なし → 今すぐ使用可
      queueData.current = member.id;
      reservationQueue.set(guild.id, queueData);

      await voiceChannel.edit({ name: '歌枠・カラオケ🔴使用中' });

      await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, {
        CONNECT: true,
        SPEAK: false,
      });

      await voiceChannel.permissionOverwrites.edit(member.id, {
        CONNECT: true,
        SPEAK: true,
      });

      await interaction.reply({ content: `🔊 ${member} が使用を開始しました。`, ephemeral: false });
    } else {
      // すでに使用中 → キューに追加
      if (queueData.queue.includes(member.id)) {
        return interaction.reply({ content: 'すでに順番待ちに登録されています。', ephemeral: true });
      }

      queueData.queue.push(member.id);
      reservationQueue.set(guild.id, queueData);

      await interaction.reply({
        content: `現在使用中です。順番を登録しました（${queueData.queue.length}番目）。`,
        ephemeral: true,
      });
    }
  }
  if (interaction.customId === 'voice_release') {
  const guild = interaction.guild;
  const member = interaction.member;
  const voiceChannel = guild.channels.cache.get('1391914535857946818');

  const queueData = reservationQueue.get(guild.id);
  if (!queueData || queueData.current !== member.id) {
    return interaction.reply({ content: 'あなたは現在の使用者ではありません。', ephemeral: true });
  }

  // 現在の使用者を解除
  queueData.current = null;

  // 次の人がいれば交代
  const nextUserId = queueData.queue.shift();
  if (nextUserId) {
    queueData.current = nextUserId;

    await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, {
      CONNECT: true,
      SPEAK: false,
    });

    await voiceChannel.permissionOverwrites.edit(nextUserId, {
      CONNECT: true,
      SPEAK: true,
    });

    await voiceChannel.setName('歌枠・カラオケ🔴使用中');

    await interaction.channel.send(`<@${nextUserId}> あなたの順番です！`);
  } else {
    // キューなし、空に戻す
    await voiceChannel.setName('歌枠・カラオケ🟢空き');

    await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, {
      CONNECT: true,
      SPEAK: true,
    });
  }

  reservationQueue.set(guild.id, queueData);
  await interaction.reply({ content: '使用を終了しました。', ephemeral: true });
}
});