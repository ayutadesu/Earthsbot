if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

/**
 * NSFWワード管理用の共通モジュール
 */
const fs = require('fs').promises;
const path = require('path');

// NSFWワードリストのファイルパス
const NSFW_WORDS_PATH = path.resolve(__dirname, '..', 'config', 'nsfwWords.json');

/**
 * NSFWワードリストを読み込む
 * @returns {Promise<string[]>} NSFWワードの配列
 */
async function loadNSFWWords() {
  try {
    try {
      await fs.access(NSFW_WORDS_PATH);
    } catch (error) {
      // ファイルが存在しない場合は空の配列で作成
      await fs.mkdir(path.dirname(NSFW_WORDS_PATH), { recursive: true });
      await fs.writeFile(NSFW_WORDS_PATH, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    
    const raw = await fs.readFile(NSFW_WORDS_PATH, 'utf8');
    const data = JSON.parse(raw);
    
    // 配列でない場合は空の配列を返す
    if (!Array.isArray(data)) {
      console.error('NSFWワードファイルのフォーマットが不正です。配列ではありません。');
      return [];
    }
    
    return data;
  } catch (err) {
    console.error('NSFWワードの読み込みに失敗:', err);
    return [];
  }
}

/**
 * NSFWワードをリストに追加
 * @param {string} word 追加するワード
 * @returns {Promise<boolean>} 追加に成功したかどうか
 */
async function addNSFWWord(word) {
  try {
    // ワードが文字列でなければ処理しない
    if (typeof word !== 'string' || !word) {
      console.error('無効なNSFWワード（空または文字列ではない）:', word);
      return false;
    }
    
    let nsfwWords = await loadNSFWWords();
    
    // 配列でなければ初期化
    if (!Array.isArray(nsfwWords)) {
      console.warn('NSFWワードが配列形式ではありませんでした。初期化します。');
      nsfwWords = [];
    }
    
    // 重複確認
    const wordLower = word.toLowerCase();
    const exists = nsfwWords.some(w => 
      typeof w === 'string' && w.toLowerCase() === wordLower
    );
    
    if (!exists) {
      nsfwWords.push(word);
      await fs.writeFile(NSFW_WORDS_PATH, JSON.stringify(nsfwWords, null, 2), 'utf8');
      console.log(`✅ NSFWワードを追加: ${word}`);
      return true;
    }
    
    return false; // 既に存在する場合
  } catch (err) {
    console.error('NSFWワードの追加に失敗:', err);
    return false;
  }
}

/**
 * 文字列内にNSFWワードが含まれているか検出
 * @param {string} content チェックする文字列
 * @returns {Promise<string[]>} 検出されたNSFWワードの配列
 */
/**
 * 文字列内にNSFWワードが含まれているか検出
 * @param {string} content チェックする文字列
 * @returns {Promise<{detected: string[], matches: string[]}>} 検出されたNSFWワード配列と一致した既存のワード配列
 */
async function detectNSFWWords(content) {
  const nsfwWords = await loadNSFWWords();
  
  // 配列かどうか確認
  if (!Array.isArray(nsfwWords)) {
    console.error('detectNSFWWords: nsfwWordsが配列ではありません:', typeof nsfwWords);
    return { detected: [], matches: [] };
  }
  
  const contentLower = content.toLowerCase();
  
  // 既存のNSFWワードと一致するものを検出
  const matches = nsfwWords.filter(word => {
    // wordが文字列かどうか確認
    if (typeof word !== 'string') {
      console.warn('無効なNSFWワード（文字列ではない）:', word);
      return false;
    }
    return contentLower.includes(word.toLowerCase());
  });
  
  // 潜在的なNSFWワードの検出（ここに検出ロジックを実装）
  // 例えば、特定のパターンや単語のリストを使用して検出
  const potentialNsfwPatterns = [
    'ちんこ', 'まんこ', 'おっぱい', 'セックス', 'ちんぽ', 'おちんちん', 'ぽこちん',
    'おまんこ', '性器', 'エロ', 'パンツ', '下着', 'ヌード', '裸', 'おしり',
    'ペニス', 'バギナ', '手コキ', 'フェラ', '中出し', '射精', 'オナニー'
    // 他にも必要なパターンを追加
  ];
  
  // 既存リストに含まれていない潜在的なNSFWワードを検出
  const detected = potentialNsfwPatterns.filter(pattern => {
    // 既存リストに含まれていない AND コンテンツに含まれている
    return !nsfwWords.some(word => word.toLowerCase() === pattern.toLowerCase()) && 
           contentLower.includes(pattern.toLowerCase());
  });
  
  console.log(`検出結果 - 既存: ${matches.length}個, 新規: ${detected.length}個`);
  return { detected, matches };
}

module.exports = {
  loadNSFWWords,
  addNSFWWord,
  detectNSFWWords
};