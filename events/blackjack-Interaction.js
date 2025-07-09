const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, setUserData } = require('../utils/cache');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const [action, type, userId] = interaction.customId.split('_');

    if (action !== 'bj') return; // ブラックジャック以外は無視
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'このボタンはあなた専用です。', ephemeral: true });
    }

    const gameData = global.activeBlackjack?.get(userId);
    if (!gameData) {
      return interaction.reply({ content: 'ゲームデータが見つかりません。最初からやり直してください。', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    const userData = getUserData(guildId, userId);

    if (type === 'hit') {
      // ヒット処理
      gameData.playerHand.push(drawCard(gameData.deck));
      const playerValue = calculateHandValue(gameData.playerHand);

      if (playerValue > 21) {
        // バースト
        gameData.gameOver = true;
        gameData.playerBust = true;
        
        // 負けた時：ベット額を所持金から減額
        userData.coins -= gameData.bet;
        setUserData(guildId, userId, userData);
        
        global.activeBlackjack.delete(userId);
      }

      const embed = createBlackjackEmbed(gameData, gameData.gameOver);
      const buttons = gameData.gameOver ? [] : createBlackjackButtons(userId, gameData);
      await interaction.update({ embeds: [embed], components: buttons });

    } else if (type === 'stand') {
      // スタンド処理（ディーラーターン）
      let dealerValue = calculateHandValue(gameData.dealerHand);
      const playerValue = calculateHandValue(gameData.playerHand);

      while (dealerValue < 17) {
        gameData.dealerHand.push(drawCard(gameData.deck));
        dealerValue = calculateHandValue(gameData.dealerHand);
      }

      gameData.gameOver = true;
      gameData.dealerRevealed = true;

      // 勝敗判定とコイン変動
      let result = '';
      if (dealerValue > 21 || playerValue > dealerValue) {
        // 勝利：ベット額の2倍を付与
        result = 'win';
        userData.coins += gameData.bet * 2;
      } else if (playerValue < dealerValue) {
        // 負け：ベット額を所持金から減額
        result = 'lose';
        userData.coins -= gameData.bet;
      } else {
        // 引き分け：ベット額をそのまま返却（変動なし）
        result = 'draw';
      }

      setUserData(guildId, userId, userData);
      global.activeBlackjack.delete(userId);

      const embed = createBlackjackEmbed(gameData, true);
      await interaction.update({ embeds: [embed], components: [] });

    } else if (type === 'quit') {
      // 降参処理：ベットの半額返金（実質半額の損失）
      userData.coins -= Math.floor(gameData.bet / 2);
      setUserData(guildId, userId, userData);
      global.activeBlackjack.delete(userId);

      const embed = createBlackjackEmbed(gameData, true);
      embed.addFields({ name: '🎯 結果', value: '降参しました（ベットの半額損失）' });
      await interaction.update({ embeds: [embed], components: [] });
    }
  },
};

// 必要なブラックジャック関数（utilsなし）

function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.rank === 'A') {
      aces++;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      value += 10;
    } else {
      value += parseInt(card.rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

function drawCard(deck) {
  return deck.pop();
}

function createBlackjackEmbed(gameData, gameOver) {
  const playerValue = calculateHandValue(gameData.playerHand);
  const dealerValue = calculateHandValue(gameData.dealerHand);

  const playerCards = gameData.playerHand.map(card => `${card.rank}${card.suit}`).join(' ');
  const dealerCards = gameOver ?
    gameData.dealerHand.map(card => `${card.rank}${card.suit}`).join(' ') :
    `${gameData.dealerHand[0].rank}${gameData.dealerHand[0].suit} ??`;

  const embed = new EmbedBuilder()
    .setTitle('🃏 ブラックジャック')
    .setColor(gameOver ? (playerValue > 21 ? 0xFF0000 : 0x00FF00) : 0x0099FF)
    .addFields(
      { name: '🎴 あなたの手札', value: `${playerCards}\n**合計: ${playerValue}**`, inline: true },
      { name: '🎭 ディーラーの手札', value: `${dealerCards}\n**合計: ${gameOver ? dealerValue : '??'}**`, inline: true }
    );

  if (gameOver) {
    let result = '';
    if (playerValue > 21) {
      result = '💥 バースト！ 負けです';
    } else if (dealerValue > 21) {
      result = '🎉 ディーラーバースト！ 勝利です';
    } else if (playerValue > dealerValue) {
      result = '🎉 勝利です！';
    } else if (playerValue < dealerValue) {
      result = '😢 負けです';
    } else {
      result = '🤝 引き分けです';
    }
    embed.addFields({ name: '🎯 結果', value: result, inline: false });
  }

  return embed;
}

function createBlackjackButtons(userId, gameData) {
  const playerValue = calculateHandValue(gameData.playerHand);
  const canHit = playerValue < 21;

  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bj_hit_${userId}`)
      .setLabel('🎯 ヒット')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canHit),
    new ButtonBuilder()
      .setCustomId(`bj_stand_${userId}`)
      .setLabel('🛑 スタンド')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`bj_quit_${userId}`)
      .setLabel('❌ 降参')
      .setStyle(ButtonStyle.Danger)
  )];
}