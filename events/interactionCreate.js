// events/interactionCreate.js
const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, setUserData } = require('../utils/cache');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // スラッシュコマンドの処理
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ エラー')
                    .setDescription('コマンドの実行中にエラーが発生しました。')
                    .setColor(0xFF0000);

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }

        // ボタンインタラクションの処理
        if (interaction.isButton()) {
            const customId = interaction.customId;
            
            // マインズゲームのボタン処理
            if (customId.startsWith('mines_')) {
                await handleMinesButton(interaction);
            }
            // キャッシュアウトボタン処理
            else if (customId.startsWith('cashout_')) {
                await handleCashoutButton(interaction);
            }
        }
    }
};

// マインズゲームのボタン処理
async function handleMinesButton(interaction) {
    const [, userId, indexStr] = interaction.customId.split('_');
    const cellIndex = parseInt(indexStr);
    
    // 他のユーザーのゲームボタンを押した場合
    if (userId !== interaction.user.id) {
        const embed = new EmbedBuilder()
            .setTitle('❌ 無効な操作')
            .setDescription('他のプレイヤーのゲームです。')
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // グローバルのactiveGamesを確認
    if (!global.activeGames) {
        global.activeGames = new Map();
    }

    const gameData = global.activeGames.get(userId);
    if (!gameData) {
        const embed = new EmbedBuilder()
            .setTitle('❌ ゲームが見つかりません')
            .setDescription('ゲームデータが存在しません。新しいゲームを開始してください。')
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // 既にクリック済みのセル
    if (gameData.revealed.has(cellIndex)) {
        return interaction.reply({ content: '既にクリック済みです。', ephemeral: true });
    }

    gameData.revealed.add(cellIndex);

    // 爆弾にヒットした場合
    if (gameData.bombs.has(cellIndex)) {
        global.activeGames.delete(userId);
        
        // 統計更新（コインの追加減算はしない - 既に最初に引かれているため）
        const guildId = interaction.guild.id;
        const userData = getUserData(guildId, userId);
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        userData.totalLosses = (userData.totalLosses || 0) + gameData.bet;
        setUserData(guildId, userId, userData);
        
        const embed = new EmbedBuilder()
            .setTitle('💥 ゲームオーバー')
            .setDescription('爆弾を踏んでしまいました！')
            .addFields(
                { name: '💳 残高', value: `${userData.coins} コイン`, inline: true }
            )
            .setColor(0xFF0000);

        const resultButtons = createResultButtons(gameData, true);
        await interaction.update({ embeds: [embed], components: resultButtons });
        return;
    }

    // 安全なセルを見つけた場合
    gameData.foundSafe++;
    gameData.multiplier = calculateMultiplier(gameData.foundSafe, gameData.bombCount, 25);

    const winAmount = Math.floor(gameData.bet * gameData.multiplier);

    const embed = new EmbedBuilder()
        .setTitle('💎 安全なセル発見！')
        .setDescription(`💎を発見しました！`)
        .addFields(
            { name: '💰 現在の獲得予想', value: `${winAmount} コイン`, inline: true },
            { name: '🎯 倍率', value: `${gameData.multiplier.toFixed(2)}x`, inline: true },
            { name: '🔍 発見済み', value: `${gameData.foundSafe}/${25 - gameData.bombCount}`, inline: true }
        )
        .setColor(0x00FF00);

    // 全ての安全なセルを見つけた場合（完全勝利）
    if (gameData.foundSafe === (25 - gameData.bombCount)) {
        global.activeGames.delete(userId);
        
        const guildId = interaction.guild.id;
        const userData = getUserData(guildId, userId);
        userData.coins += winAmount;
        userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
        userData.totalWinnings = (userData.totalWinnings || 0) + winAmount;
        setUserData(guildId, userId, userData);

        embed.setTitle('🎉 完全勝利！')
            .setDescription(`全ての💎を発見しました！\n獲得コイン: ${winAmount} コイン`)
            .addFields(
                { name: '💳 残高', value: `${userData.coins} コイン`, inline: true }
            );

        const resultButtons = createResultButtons(gameData, false);
        await interaction.update({ embeds: [embed], components: resultButtons });
        return;
    }

    // ゲーム継続
    const updatedButtons = updateMinesButtons(interaction.message.components, userId, gameData);
    await interaction.update({ embeds: [embed], components: updatedButtons });
}

// キャッシュアウトボタン処理
async function handleCashoutButton(interaction) {
    const [, userId] = interaction.customId.split('_');
    
    if (userId !== interaction.user.id) {
        const embed = new EmbedBuilder()
            .setTitle('❌ 無効な操作')
            .setDescription('他のプレイヤーのゲームです。')
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!global.activeGames) {
        global.activeGames = new Map();
    }

    const gameData = global.activeGames.get(userId);
    if (!gameData) {
        const embed = new EmbedBuilder()
            .setTitle('❌ ゲームが見つかりません')
            .setDescription('ゲームデータが存在しません。')
            .setColor(0xFF0000);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (gameData.foundSafe === 0) {
        return interaction.reply({ content: '安全なセルを少なくとも1つ見つけてからキャッシュアウトできます。', ephemeral: true });
    }

    global.activeGames.delete(userId);
    
    const winAmount = Math.floor(gameData.bet * gameData.multiplier);
    const guildId = interaction.guild.id;
    const userData = getUserData(guildId, userId);
    userData.coins += winAmount;
    userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
    userData.totalWinnings = (userData.totalWinnings || 0) + winAmount;
    setUserData(guildId, userId, userData);

    const embed = new EmbedBuilder()
        .setTitle('💰 キャッシュアウト成功！')
        .setDescription(`安全にキャッシュアウトしました！`)
        .addFields(
            { name: '💎 発見したセル', value: `${gameData.foundSafe}個`, inline: true },
            { name: '💰 獲得コイン', value: `${winAmount} コイン`, inline: true },
            { name: '💳 残高', value: `${userData.coins} コイン`, inline: true }
        )
        .setColor(0x00AE86);

    const resultButtons = createResultButtons(gameData, false);
    await interaction.update({ embeds: [embed], components: resultButtons });
}

// ゲームデータ作成
function createGameData(bet, bombCount) {
    const totalCells = 24;
    const safeCount = totalCells - bombCount;
    
    // 爆弾の位置をランダムに決定
    const bombs = new Set();
    while (bombs.size < bombCount) {
        bombs.add(Math.floor(Math.random() * totalCells));
    }

    return {
        bet,
        bombCount,
        bombs,
        revealed: new Set(),
        multiplier: 1.0,
        safeCount,
        foundSafe: 0
    };
}

// ボタン作成
function createMinesButtons(userId) {
    const rows = [];
    let index = 0;

    for (let row = 0; row < 5; row++) {
        const actionRow = new ActionRowBuilder();
        for (let col = 0; col < 5; col++) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`mines_${userId}_${index}`)
                    .setLabel('❓')
                    .setStyle(ButtonStyle.Secondary)
            );
            index++;
        }
        rows.push(actionRow);
    }

    // キャッシュアウトボタン
    const cashoutRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`cashout_${userId}`)
            .setLabel('💰 キャッシュアウト')
            .setStyle(ButtonStyle.Success)
    );
    rows.push(cashoutRow);

    return rows;
}

// 倍率計算
function calculateMultiplier(foundSafe, bombCount, totalCells) {
    const safeCount = totalCells - bombCount;
    if (foundSafe === 0) return 1.0;
    
    let multiplier = 1.0;
    for (let i = 0; i < foundSafe; i++) {
        const remainingSafe = safeCount - i;
        const remainingTotal = totalCells - bombCount - i;
        multiplier *= (remainingTotal + 1) / remainingSafe;
    }
    return multiplier;
}

// ボタンの更新
function updateMinesButtons(components, userId, gameData) {
    const updatedComponents = [];
    
    for (let rowIndex = 0; rowIndex < components.length - 1; rowIndex++) { // 最後の行（キャッシュアウト）は除く
        const row = components[rowIndex];
        const newRow = new ActionRowBuilder();
        
        for (let buttonIndex = 0; buttonIndex < row.components.length; buttonIndex++) {
            const cellIndex = rowIndex * 5 + buttonIndex;
            
            if (gameData.revealed.has(cellIndex)) {
                if (gameData.bombs.has(cellIndex)) {
                    newRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`mines_${userId}_${cellIndex}`)
                            .setLabel('💥')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    );
                } else {
                    newRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`mines_${userId}_${cellIndex}`)
                            .setLabel('💎')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)
                    );
                }
            } else {
                newRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mines_${userId}_${cellIndex}`)
                        .setLabel('❓')
                        .setStyle(ButtonStyle.Secondary)
                );
            }
        }
        updatedComponents.push(newRow);
    }
    
    // キャッシュアウトボタン
    updatedComponents.push(components[components.length - 1]);
    
    return updatedComponents;
}

// 結果表示用のボタン（無効化）
function createResultButtons(gameData, showBombs = false) {
    const rows = [];
    let index = 0;

    for (let row = 0; row < 5; row++) {
        const actionRow = new ActionRowBuilder();
        for (let col = 0; col < 5; col++) {
            let label = '❓';
            let style = ButtonStyle.Secondary;
            
            if (gameData.revealed.has(index)) {
                if (gameData.bombs.has(index)) {
                    label = '💥';
                    style = ButtonStyle.Danger;
                } else {
                    label = '💎';
                    style = ButtonStyle.Success;
                }
            } else if (showBombs && gameData.bombs.has(index)) {
                label = '💣';
                style = ButtonStyle.Danger;
            }
            
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`disabled_${index}`)
                    .setLabel(label)
                    .setStyle(style)
                    .setDisabled(true)
            );
            index++;
        }
        rows.push(actionRow);
    }

    return rows;
}

// 関数をエクスポート
module.exports.createGameData = createGameData;
module.exports.createMinesButtons = createMinesButtons;
module.exports.calculateMultiplier = calculateMultiplier;

