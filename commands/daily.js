const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, setUserData } = require('../utils/cache');

module.exports = {
data: new SlashCommandBuilder()
.setName('daily')
.setDescription('デイリーボーナスを受け取る'),

async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const userData = getUserData(guildId, userId);

    const now = new Date();
    const currentPeriod4AM = getCurrentPeriod4AM();
    const nextPeriod4AM = new Date(currentPeriod4AM.getTime() + 24 * 60 * 60 * 1000);

    // 現在の期間（今日の4時〜明日の4時）にデイリーを取得済みかチェック
    if (userData.lastDaily && userData.lastDaily >= currentPeriod4AM.getTime() && userData.lastDaily < nextPeriod4AM.getTime()) {
        const timeLeft = nextPeriod4AM.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        
        const embed = new EmbedBuilder()
            .setTitle('⏰ デイリー報酬受取済み')
            .setDescription(`次のデイリー報酬まで: ${hoursLeft}時間 ${minutesLeft}分\n（毎朝4:00にリセット）`)
            .setColor(0xFF6B6B);
            
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    // 連続ログインの計算
    const previousPeriod4AM = new Date(currentPeriod4AM.getTime() - 24 * 60 * 60 * 1000);
    if (!userData.lastDaily || userData.lastDaily < previousPeriod4AM.getTime()) {
        userData.dailyStreak = 0; // 前の期間より前の場合はリセット
    }

    const dailyAmount = 3000;
    userData.coins = (userData.coins || 0) + dailyAmount;
    userData.lastDaily = now.getTime();
    userData.dailyStreak = (userData.dailyStreak || 0) + 1;
    
    setUserData(guildId, userId, userData);

    const embed = new EmbedBuilder()
        .setTitle('🎉 デイリーボーナス獲得！')
        .addFields(
            { name: '💰 獲得コイン', value: `${dailyAmount} コイン`, inline: true },
            { name: '🔥 連続ログイン', value: `${userData.dailyStreak}日`, inline: true },
            { name: '💳 現在の残高', value: `${userData.coins} コイン`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: '次回リセット: 毎朝4:00' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

};

// 現在の期間の開始時刻（4時）を取得する関数
function getCurrentPeriod4AM() {
const now = new Date();


// 日本時間（UTC+9）で現在時刻を取得
const jstOffset = 9 * 60; // 9時間のオフセット（分単位）
const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));

// 今日の4時を設定
const today4AM = new Date(jstTime);
today4AM.setHours(4, 0, 0, 0);

// もし現在時刻が4時より前なら、昨日の4時を基準にする
// （例：午前2時なら前日の4時〜今日の4時の期間内）
if (jstTime.getHours() < 4) {
    today4AM.setDate(today4AM.getDate() - 1);
}

// UTCに戻して返す
return new Date(today4AM.getTime() - (jstOffset * 60 * 1000));

}