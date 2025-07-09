const { Events, EmbedBuilder } = require('discord.js');
const { pokerGames } = require('../utils/pokerGames');
const { createDeck, shuffle } = require('../utils/deck');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const game = pokerGames.get(interaction.channel.id);
    if (!game) return;

    const userId = interaction.user.id;

    if (interaction.customId === 'poker_join') {
      if (game.players.find(p => p.id === userId)) {
        await interaction.reply({ content: '既に参加しています。', flags: 64 });
        return;
      }
      game.players.push({ id: userId, name: interaction.user.username, hand: [] });

      const embed = new EmbedBuilder()
        .setTitle('♠ ポーカー ロビー')
        .setDescription(game.players.map(p => `<@${p.id}>`).join('\n'))
        .setColor('#3498db');

      await interaction.update({ embeds: [embed] });
    }

    else if (interaction.customId === 'poker_start') {
      if (interaction.user.id !== game.hostId) {
        await interaction.reply({ content: 'ホストのみ開始できます。', flags: 64 });
        return;
      }

      if (game.players.length < 2) {
        await interaction.reply({ content: '2人以上の参加が必要です。', flags: 64 });
        return;
      }

      game.status = 'playing';
      game.stage = 'preflop';
      const deck = shuffle(createDeck());
      game.deck = deck;
      game.community = [];

      for (const player of game.players) {
        player.hand = [deck.pop(), deck.pop()];
      }

      const embed = new EmbedBuilder()
        .setTitle('♣ ゲーム開始')
        .setDescription(game.players.map(p => `<@${p.id}> にカードを配りました。`).join('\n'))
        .setColor('#f1c40f');

      await interaction.update({ embeds: [embed], components: [] });

      // 続くステージやベッティング処理もここに追加可能
    }

    else if (interaction.customId === 'poker_cancel') {
      if (interaction.user.id !== game.hostId) {
        await interaction.reply({ content: 'ホストのみキャンセルできます。', flags: 64 });
        return;
      }

      pokerGames.delete(interaction.channel.id);

      const embed = new EmbedBuilder()
        .setTitle('🛑 ゲームキャンセル')
        .setDescription('ゲームはキャンセルされました。')
        .setColor('#e74c3c');

      await interaction.update({ embeds: [embed], components: [] });
    }
  }
};