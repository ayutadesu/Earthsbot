// utils/itemInfo.js - アイテム情報を管理するユーティリティ

// アイテム情報を取得する関数（カスタム商品対応）
function getItemInfo(itemId, guildId = null) {
  // デフォルトの商品情報
  const itemsData = {
    'android-baunty-5500': { name: '【Android専用】バウンティ石垢（5500石前後+金片550枚）', price: 600 },
    'ios-baunty-3800': { name: '【iOS専用】バウンティ石垢（3800石前後+金片300枚）', price: 400 },
    'ios-baunty-4300': { name: '【iOS専用】バウンティ石垢（4300石前後+金欠片400枚）', price: 600 },
    'ios-baunty-5300': { name: '【iOS専用】バウンティ石垢（5300石前後＋金欠片500枚）', price: 1100 },
    'proseka-10-12': { name: 'プロセカ石垢（10～12万クリスタル）', price: 250 },
    'proseka-13-15': { name: 'プロセカ石垢（13〜15万クリスタル+星4★9体以上）', price: 550 },
    'proseka-15-17': { name: 'プロセカ石垢（15～17万クリスタル+星4★10体以上）', price: 800 },
    'monsuto-700-1000': { name: 'モンスト石垢（700～1000オーブ）', price: 400 },
    'monsuto-1000-1300': { name: 'モンスト石垢（1000～1300オーブ）', price: 300 },
    'monsuto-1200-1500': { name: 'モンスト石垢（1200～1500オーブ）', price: 400 }
  };

  // デフォルト商品が存在する場合はそれを返す
  if (itemsData[itemId]) {
    return itemsData[itemId];
  }

  // カスタム商品をチェック
  if (guildId && global.customItems && global.customItems[guildId] && global.customItems[guildId][itemId]) {
    return global.customItems[guildId][itemId];
  }

  // どちらにも見つからない場合は不明な商品として返す
  return { name: '不明な商品', price: 0 };
}

// 全てのアイテムIDのリストを取得（カスタム商品含む）
function getAllItemIds(guildId = null) {
  const defaultItemIds = [
    'android-baunty-5500',
    'ios-baunty-3800', 
    'ios-baunty-4300',
    'ios-baunty-5300',
    'proseka-10-12',
    'proseka-13-15',
    'proseka-15-17',
    'monsuto-700-1000',
    'monsuto-1000-1300',
    'monsuto-1200-1500'
  ];

  // カスタム商品のIDも追加
  if (guildId && global.customItems && global.customItems[guildId]) {
    const customItemIds = Object.keys(global.customItems[guildId]);
    return [...defaultItemIds, ...customItemIds];
  }

  return defaultItemIds;
}

// デフォルト商品のIDのみを取得
function getDefaultItemIds() {
  return [
    'android-baunty-5500',
    'ios-baunty-3800', 
    'ios-baunty-4300',
    'ios-baunty-5300',
    'proseka-10-12',
    'proseka-13-15',
    'proseka-15-17',
    'monsuto-700-1000',
    'monsuto-1000-1300',
    'monsuto-1200-1500'
  ];
}

module.exports = {
  getItemInfo,
  getAllItemIds,
  getDefaultItemIds
};