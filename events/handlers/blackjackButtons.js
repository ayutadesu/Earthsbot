// handlers/blackjackButtons.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// blackjack.jsから必要な関数とデータをインポート
const blackjackCommand = require('../commands/blackjack.js');
const { blackjackSession, drawCard, calcTotal, checkWinner, updateCoins } = blackjackCommand;

const coinPath = path.join(__dirname, '..', 'config', 'servercoins.json');

// カード表示用のヘルパー関数
const display = (cards) => cards.map(card => card.display).join(' ');

// ブラックジャックボタンインタラクション処理
async function handleBlackjackButtons(interaction) {
  if (!interaction.isButton()) return false;
  
  // ブラックジャック関連のボタンかチェック
  const blackjackButtons = ['hit', 'stand', 'double'];
  if (!blackjackButtons.includes(interaction.customId)) return false;

  const userId = interaction.user.id;
  const session = blackjackSession[userId];
  
  if (!session) {
    return interaction.reply({ 
      content: '❌ ゲームセッションが見つかりません。`/blackjack` コマンドで新しくゲームを開始してください。', 
      ephemeral: true 
    });
  }

  try {
    // ダブルダウン処理
    if (interaction.customId === 'double') {
      return await handleDoubleDown(interaction, session, userId);
    }

    // ヒット処理
    if (interaction.customId === 'hit') {
      return await handleHit(interaction, session, userId);
    }

    // スタンド処理
    if (interaction.customId === 'stand') {
      return await handleStand(interaction, session, userId);
    }

  } catch (error) {
    console.error('ブラックジャックボタン処理エラー:', error);
    return interaction.reply({ 
      content: '⚠️ システムエラーが発生しました。もう一度お試しください。', 
      ephemeral: true 
    });
  }

  return true;
}

// ダブルダウン処理
async function handleDoubleDown(interaction, session, userId) {
  // ダブルダウンの条件チェック（最初の2枚のカードの時のみ）
  if (session.player.length !== 2) {
    return interaction.reply({ 
      content: '❌ ダブルダウンは最初の2枚のカードの時のみ可能です。', 
      ephemeral: true 
    });
  }

  // コイン残高チェック
  let data = {};
  if (fs.existsSync(coinPath)) {
    data = JSON.parse(fs.readFileSync(coinPath, 'utf-8') || '{}');
  }
  
  if (!data[userId] || data[userId] < session.bet) {
    return interaction.reply({ 
      content: '💸 ダブルダウンに必要なコインが足りません！', 
      ephemeral: true 
    });
  }

  // 賭け金を2倍に
  const originalBet = session.bet;
  session.bet *= 2;
  
  // 1枚だけカードを引く
  const newCard = drawCard();
  session.player.push(newCard);
  const playerTotal = calcTotal(session.player);

  // バーストチェック
  if (playerTotal > 21) {
    updateCoins(userId, -session.bet); // 賭け金を没収
    delete blackjackSession[userId];
    
    return interaction.update({ 
      content: `💥 **ダブルダウン - バースト！**\n\n` +
               `🃏 あなたのカード: ${display(session.player)} (合計: **${playerTotal}**)\n` +
               `💰 **${session.bet}コイン** を失いました...\n\n` +
               `🎲 新しいゲームを始めるには \`/blackjack\` コマンドを使用してください。`, 
      components: [] 
    });
  }

  // ディーラーのターン
  while (calcTotal(session.dealer) < 17) {
    session.dealer.push(drawCard());
  }
  
  const dealerTotal = calcTotal(session.dealer);
  const result = checkWinner(playerTotal, dealerTotal);
  
  // 結果に応じてコインを更新
  let coinChange = 0;
  let resultMessage = '';
  
  if (result.includes('勝ち')) {
    coinChange = session.bet;
    updateCoins(userId, coinChange);
    resultMessage = `🎉 **勝利！** +${coinChange}コイン`;
  } else if (result.includes('引き分け')) {
    resultMessage = `🤝 **引き分け！** ±0コイン`;
  } else {
    coinChange = -session.bet;
    updateCoins(userId, coinChange);
    resultMessage = `💀 **敗北...** ${coinChange}コイン`;
  }

  delete blackjackSession[userId];
  
  return interaction.update({
    content: `🎲 **ダブルダウン完了！**\n\n` +
             `🃏 あなた: ${display(session.player)} (合計: **${playerTotal}**)\n` +
             `🎰 ディーラー: ${display(session.dealer)} (合計: **${dealerTotal}**)\n\n` +
             `${resultMessage}\n` +
             `💰 賭け金: ${originalBet} → **${session.bet}コイン**\n\n` +
             `🎲 新しいゲームを始めるには \`/blackjack\` コマンドを使用してください。`,
    components: []
  });
}

// ヒット処理
async function handleHit(interaction, session, userId) {
  const newCard = drawCard();
  session.player.push(newCard);
  const playerTotal = calcTotal(session.player);

  if (playerTotal > 21) {
    updateCoins(userId, -session.bet);
    delete blackjackSession[userId];
    
    return interaction.update({
      content: `💥 **バースト！**\n\n` +
               `🃏 あなたのカード: ${display(session.player)} (合計: **${playerTotal}**)\n` +
               `💰 **${session.bet}コイン** を失いました...\n\n` +
               `🎲 新しいゲームを始めるには \`/blackjack\` コマンドを使用してください。`,
      components: []
    });
  }

  // プレイヤーがまだ21以下の場合、ボタンを更新（ダブルダウンは削除）
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('hit')
      .setLabel('ヒット')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('stand')
      .setLabel('スタンド')
      .setStyle(ButtonStyle.Secondary)
  );

  return interaction.update({
    content: `🎰 **ブラックジャック** (賭け金: **${session.originalBet || session.bet}コイン**)\n\n` +
             `🃏 あなたのカード: ${display(session.player)} (合計: **${playerTotal}**)\n` +
             `🎰 ディーラー: ${session.dealer[0].display} 🂠\n\n` +
             `どうしますか？`,
    components: [row]
  });
}

// スタンド処理
async function handleStand(interaction, session, userId) {
  const playerTotal = calcTotal(session.player);
  
  // ディーラーのターン
  while (calcTotal(session.dealer) < 17) {
    session.dealer.push(drawCard());
  }
  
  const dealerTotal = calcTotal(session.dealer);
  const result = checkWinner(playerTotal, dealerTotal);
  
  // 結果に応じてコインを更新
  let coinChange = 0;
  let resultMessage = '';
  
  if (result.includes('勝ち')) {
    coinChange = session.bet;
    updateCoins(userId, coinChange);
    resultMessage = `🎉 **勝利！** +${coinChange}コイン`;
  } else if (result.includes('引き分け')) {
    resultMessage = `🤝 **引き分け！** ±0コイン`;
  } else {
    coinChange = -session.bet;
    updateCoins(userId, coinChange);
    resultMessage = `💀 **敗北...** ${coinChange}コイン`;
  }

  delete blackjackSession[userId];
  
  return interaction.update({
    content: `🎯 **ゲーム終了！**\n\n` +
             `🃏 あなた: ${display(session.player)} (合計: **${playerTotal}**)\n` +
             `🎰 ディーラー: ${display(session.dealer)} (合計: **${dealerTotal}**)\n\n` +
             `${resultMessage}\n` +
             `💰 賭け金: **${session.bet}コイン**\n\n` +
             `🎲 新しいゲームを始めるには \`/blackjack\` コマンドを使用してください。`,
    components: []
  });
}

module.exports = {
  handleBlackjackButtons
};