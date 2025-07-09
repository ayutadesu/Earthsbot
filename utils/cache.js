// utils/cache.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const serverDataPath = path.join(dataDir, 'servercoins.json');

// データディレクトリが存在しない場合は作成
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// メモリキャッシュ
let serverData = {};

// ファイルからデータを読み込み
function loadData() {
    try {
        if (fs.existsSync(serverDataPath)) {
            const data = fs.readFileSync(serverDataPath, 'utf8');
            serverData = JSON.parse(data);
            console.log('Server data loaded successfully');
        } else {
            serverData = {};
            console.log('No existing server data found, starting fresh');
        }
    } catch (error) {
        console.error('Error loading server data:', error);
        serverData = {};
    }
}

// ファイルにデータを保存
function saveData() {
    try {
        fs.writeFileSync(serverDataPath, JSON.stringify(serverData, null, 2));
    } catch (error) {
        console.error('Error saving server data:', error);
    }
}

// 定期的にデータを保存（5分間隔）
setInterval(saveData, 5 * 60 * 1000);

// プロセス終了時にデータを保存
process.on('SIGINT', () => {
    console.log('Saving data before exit...');
    saveData();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Saving data before exit...');
    saveData();
    process.exit(0);
});

// ユーザーデータのデフォルト値
function getDefaultUserData() {
    return {
        coins: 0,
        lastDaily: 0,
        dailyStreak: 0,
        gamesPlayed: 0,
        totalWinnings: 0,
        totalLosses: 0
    };
}

// 在庫データのデフォルト値
function getDefaultInventoryData() {
    return {
        'android-baunty-5500': [],
        'ios-baunty-3800': [],
        'ios-baunty-4300': [],
        'ios-baunty-5300': [],
        'proseka-10-12': [],
        'proseka-13-15': [],
        'proseka-15-17': [],
        'monsuto-700-1000': [],
        'monsuto-1000-1300': [],
        'monsuto-1200-1500': []
    };
}

// ユーザーデータを取得
function getUserData(guildId, userId) {
    if (!serverData[guildId]) {
        serverData[guildId] = {};
    }
    
    if (!serverData[guildId][userId]) {
        serverData[guildId][userId] = getDefaultUserData();
    }
    
    return serverData[guildId][userId];
}

// ユーザーデータを設定
function setUserData(guildId, userId, userData) {
    if (!serverData[guildId]) {
        serverData[guildId] = {};
    }
    
    serverData[guildId][userId] = { ...getDefaultUserData(), ...userData };
}

// サーバーデータを取得
function getServerData(guildId) {
    if (!serverData[guildId]) {
        serverData[guildId] = {};
    }
    return serverData[guildId];
}

// 在庫データを取得
function getInventoryData(guildId) {
    if (!serverData[guildId]) {
        serverData[guildId] = {};
    }
    
    if (!serverData[guildId].inventory) {
        serverData[guildId].inventory = getDefaultInventoryData();
    }
    
    return serverData[guildId].inventory;
}

// 在庫にアイテムを追加
function addInventoryItem(guildId, itemId, content) {
    const inventory = getInventoryData(guildId);
    if (!inventory[itemId]) {
        inventory[itemId] = [];
    }
    
    inventory[itemId].push({
        content: content,
        addedAt: Date.now()
    });
}

// 在庫からアイテムを消費（古いものから）
function consumeInventoryItem(guildId, itemId) {
    const inventory = getInventoryData(guildId);
    if (!inventory[itemId] || inventory[itemId].length === 0) {
        return null;
    }
    
    // 古い順にソート
    inventory[itemId].sort((a, b) => a.addedAt - b.addedAt);
    
    // 最も古いアイテムを取得して削除
    return inventory[itemId].shift();
}

// 全サーバーデータを取得（ランキング用）
function get(guildId) {
    return getServerData(guildId);
}

// 初期化時にデータを読み込み
loadData();

module.exports = {
    getUserData,
    setUserData,
    getServerData,
    get,
    loadServerData: loadData,
    saveServerData: saveData,
    getInventoryData,
    addInventoryItem,
    consumeInventoryItem
};