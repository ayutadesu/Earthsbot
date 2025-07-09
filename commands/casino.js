// commands/casino.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getUserData, setUserData } = require('../utils/cache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('カジノゲーム集')
    .addSubcommand(subcommand =>
      subcommand
        .setName('blackjack')
        .setDescription('ブラックジャックゲームを開始')
        .addStringOption(option => 
          option.setName('bet')
            .setDescription('掛け金（コイン数 または "all"）')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('roulette')
        .setDescription('ルーレットゲーム')
        .addStringOption(option => 
          option.setName('bet')
            .setDescription('掛け金（コイン数 または "all"）')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('type')
            .setDescription('ベットタイプ')
            .setRequired(true)
            .addChoices(
              { name: '赤 (2倍)', value: 'red' },
              { name: '黒 (2倍)', value: 'black' },
              { name: '奇数 (2倍)', value: 'odd' },
              { name: '偶数 (2倍)', value: 'even' },
              { name: '数字指定 (36倍)', value: 'number' }
            ))
        .addIntegerOption(option =>
          option.setName('number')
            .setDescription('数字指定の場合の番号（0-36）')
            .setMinValue(0)
            .setMaxValue(36)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('slot')
        .setDescription('スロットマシン')
        .addStringOption(option => 
          option.setName('bet')
            .setDescription('掛け金（コイン数 または "all"）')
            .setRequired(true))),

  async execute(interaction) {
    try {
      // CRITICAL: Defer the reply immediately to prevent timeout
      await interaction.deferReply();
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'blackjack':
          await executeBlackjack(interaction);
          break;
        case 'roulette':
          await executeRoulette(interaction);
          break;
        case 'slot':
          await executeSlot(interaction);
          break;
      }
    } catch (error) {
      console.error('Casino command error:', error);
      
      // Safe error response handling
      const errorEmbed = createErrorEmbed('エラー', 'コマンド実行中にエラーが発生しました。');
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else if (!interaction.replied) {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  }
};

// ブラックジャック実行
async function executeBlackjack(interaction) {
  const betInput = interaction.options.getString('bet');
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  
  const userData = getUserData(guildId, userId);
  let bet = parseBet(betInput, userData.coins);
  
  if (bet === null) {
    return interaction.editReply({ embeds: [createErrorEmbed('無効な入力', 'ベット金額は1以上の数値、または "all" を入力してください。')] });
  }
  
  if (userData.coins < bet) {
    return interaction.editReply({ embeds: [createErrorEmbed('コイン不足', `現在の残高: ${userData.coins} コイン`)] });
  }

  if (global.activeBlackjack && global.activeBlackjack.has(userId)) {
    return interaction.editReply({ embeds: [createErrorEmbed('ゲーム進行中', '既にブラックジャックが進行中です。')] });
  }

  // ゲーム開始
  userData.coins -= bet;
  setUserData(guildId, userId, userData);

  const gameData = createBlackjackGame(bet);
  if (!global.activeBlackjack) global.activeBlackjack = new Map();
  global.activeBlackjack.set(userId, gameData);

  const embed = createBlackjackEmbed(gameData, false);
  const buttons = createBlackjackButtons(userId, gameData);
  
  await interaction.editReply({ embeds: [embed], components: buttons });
}

// ルーレット実行
async function executeRoulette(interaction) {
  const betInput = interaction.options.getString('bet');
  const betType = interaction.options.getString('type');
  const number = interaction.options.getInteger('number');
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  const userData = getUserData(guildId, userId);
  let bet = parseBet(betInput, userData.coins);

  if (bet === null) {
    return interaction.editReply({ embeds: [createErrorEmbed('無効な入力', 'ベット金額は1以上の数値、または "all" を入力してください。')] });
  }

  if (userData.coins < bet) {
    return interaction.editReply({ embeds: [createErrorEmbed('コイン不足', `現在の残高: ${userData.coins} コイン`)] });
  }

  if (betType === 'number' && number === null) {
    return interaction.editReply({ embeds: [createErrorEmbed('数字未指定', '数字指定ベットの場合は番号を入力してください。')] });
  }

  // ルーレット実行
  userData.coins -= bet;
  const result = Math.floor(Math.random() * 37); // 0-36
  let won = false;
  let multiplier = 0;

  switch (betType) {
    case 'red':
      const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      won = redNumbers.includes(result);
      multiplier = 2;
      break;
    case 'black':
      const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
      won = blackNumbers.includes(result);
      multiplier = 2;
      break;
    case 'odd':
      won = result > 0 && result % 2 === 1;
      multiplier = 2;
      break;
    case 'even':
      won = result > 0 && result % 2 === 0;
      multiplier = 2;
      break;
    case 'number':
      won = result === number;
      multiplier = 36;
      break;
  }

  const winAmount = won ? bet * multiplier : 0;
  userData.coins += winAmount;
  setUserData(guildId, userId, userData);

  const embed = createRouletteResultEmbed(result, betType, number, bet, winAmount, userData.coins, won);
  await interaction.editReply({ embeds: [embed] });
}

// スロット実行
async function executeSlot(interaction) {
  const betInput = interaction.options.getString('bet');
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;

  const userData = getUserData(guildId, userId);
  let bet = parseBet(betInput, userData.coins);

  if (bet === null) {
    return interaction.editReply({ embeds: [createErrorEmbed('無効な入力', 'ベット金額は1以上の数値、または "all" を入力してください。')] });
  }

  if (userData.coins < bet) {
    return interaction.editReply({ embeds: [createErrorEmbed('コイン不足', `現在の残高: ${userData.coins} コイン`)] });
  }

  userData.coins -= bet;

  // スロット実行
  const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
  const weights = [30, 25, 20, 15, 6, 3, 1]; // 重み付け確率
  
  const reels = [];
  for (let i = 0; i < 3; i++) {
    reels.push(getWeightedRandomSymbol(symbols, weights));
  }

  let multiplier = 0;
  let winType = '';

  // 勝利判定
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    // 3つ揃い
    switch (reels[0]) {
      case '7️⃣': multiplier = 100; winType = 'ジャックポット！'; break;
      case '💎': multiplier = 50; winType = 'ダイヤモンド！'; break;
      case '⭐': multiplier = 25; winType = 'スター！'; break;
      case '🍇': multiplier = 10; winType = 'ぶどう3つ！'; break;
      case '🍊': multiplier = 8; winType = 'オレンジ3つ！'; break;
      case '🍋': multiplier = 6; winType = 'レモン3つ！'; break;
      case '🍒': multiplier = 38; winType = 'チェリー3つ！'; break;
    }
  } else if (reels.filter(r => r === '🍒').length === 2) {
    // チェリー2つ
    multiplier = 2;
    winType = 'チェリー2つ！';
  }

  const winAmount = bet * multiplier;
  userData.coins += winAmount;
  setUserData(guildId, userId, userData);

  const embed = createSlotResultEmbed(reels, bet, winAmount, userData.coins, winType);
  await interaction.editReply({ embeds: [embed] });
}

// ユーティリティ関数
function parseBet(betInput, userCoins) {
  if (betInput.toLowerCase() === 'all') {
    return userCoins > 0 ? userCoins : null;
  }
  const bet = parseInt(betInput);
  return (!isNaN(bet) && bet >= 1) ? bet : null;
}

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor(0xFF0000);
}

function createBlackjackGame(bet) {
  const deck = createDeck();
  const playerHand = [drawCard(deck), drawCard(deck)];
  const dealerHand = [drawCard(deck), drawCard(deck)];

  return {
    bet,
    deck,
    playerHand,
    dealerHand,
    gameOver: false,
    playerBust: false,
    dealerRevealed: false
  };
}

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  // シャッフル
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function drawCard(deck) {
  return deck.pop();
}

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

function createRouletteResultEmbed(result, betType, number, bet, winAmount, newBalance, won) {
  const color = result === 0 ? '🟢' : ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(result) ? '🔴' : '⚫');
  
  const embed = new EmbedBuilder()
    .setTitle('🎰 ルーレット結果')
    .setDescription(`${color} **${result}** が出ました！`)
    .setColor(won ? 0x00FF00 : 0xFF0000)
    .addFields(
      { name: '🎯 ベット', value: getBetTypeDisplay(betType, number), inline: true },
      { name: '💰 掛け金', value: `${bet} コイン`, inline: true },
      { name: '🏆 結果', value: won ? `勝利！ +${winAmount} コイン` : '敗北...', inline: true },
      { name: '💳 残高', value: `${newBalance} コイン`, inline: false }
    );

  return embed;
}

function getBetTypeDisplay(betType, number) {
  switch (betType) {
    case 'red': return '🔴 赤';
    case 'black': return '⚫ 黒';
    case 'odd': return '🔢 奇数';
    case 'even': return '🔢 偶数';
    case 'number': return `🎯 ${number}番`;
    default: return betType;
  }
}

function createSlotResultEmbed(reels, bet, winAmount, newBalance, winType) {
  const embed = new EmbedBuilder()
    .setTitle('🎰 スロット結果')
    .setDescription(`**${reels.join(' | ')}**`)
    .setColor(winAmount > 0 ? 0x00FF00 : 0xFF0000)
    .addFields(
      { name: '💰 掛け金', value: `${bet} コイン`, inline: true },
      { name: '🏆 結果', value: winAmount > 0 ? `${winType} +${winAmount} コイン` : '残念...', inline: true },
      { name: '💳 残高', value: `${newBalance} コイン`, inline: true }
    );

  if (winAmount > 0) {
    embed.addFields({ name: '🎉 当選', value: `${winAmount / bet}倍の配当！`, inline: false });
  }

  return embed;
}

function getWeightedRandomSymbol(symbols, weights) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < symbols.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return symbols[i];
    }
  }
  
  return symbols[symbols.length - 1];
}