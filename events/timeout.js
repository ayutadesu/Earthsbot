if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

// messageHandler.js
const event = require('discord.js');

// messageHandler.js
const fs = require('fs');
const path = require('path');

// ファイル読み込みヘルパー関数
function readFile(filePath, defaultValue) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    console.log(`✅ 新しいファイルを作成しました: ${filePath}`);
    return defaultValue;
  }
}

// 設定ファイルのパス
const serverOptionPath = path.join(__dirname, '..','config', 'serverOption.json');
const warningsPath = path.join(__dirname,'..', 'config', 'warnings.json');
const nsfwWordsPath = path.join(__dirname, '..','config', 'nsfwWords.json');

// NSFWワードの読み込み
let nsfwWords = [];
try {
  nsfwWords = readFile(nsfwWordsPath, [
    "卑猥", "エロ", "性的", "アダルト", "セックス", "ポルノ", "官能", "淫", "猥褻"
  ]);
} catch (error) {
  console.error('NSFWワードリスト読み込みエラー:', error);
}

// 警告カウントの読み込み
let warnings = {};
try {
  warnings = readFile(warningsPath, {});
} catch (error) {
  console.error('警告ファイル読み込みエラー:', error);
}

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild?.id;

    // 毎回無効サーバーリストを読み込む
    // サーバー設定ファイルの読み込み
let serverOption;
try {
  const data = fs.readFileSync(serverOptionPath, 'utf8');
  serverOption = JSON.parse(data);
} catch (error) {
  console.error('サーバー設定ファイル読み込みエラー:', error);
  serverOption = { enabledServers: [], disabledServers: [] };
}

// 無効サーバーリストの確認
if (serverOption.disabledServers.includes(guildId)) return;


    // 無効化されているサーバーなら処理をしない
    if (serverOption.disabledServers.includes(guildId)) return;

    const userId = message.author.id;
    const channelName = message.channel.name.toLowerCase();
    const content = message.content.toLowerCase();

    // serveroption.json に含まれていないサーバーなら処理しない
    if (!serverOption.enabledServers.includes(guildId)) return;

    let shouldWarn = false;
    let reason = "";
    // 「猥談」チャンネルではスキップ
    if (
      channelName.includes("猥談") 
      ) return;
    if (
      channelName.includes("デバッグ")
      ) return;

    // 雑談チャンネルでは猥談ワードチェック
    if (
      channelName.includes("雑談") &&
      nsfwWords.some((word) => content.includes(word))
    ) {
      shouldWarn = true;
      reason = "猥談の投稿";
    } else {
      // その他のチャンネルで関係のない発言をチェック
      if (
        !channelName.includes("雑談") && 
        !channelName.includes("猥談")
      ) {
        const keywords = channelName.split(/[-_・ ]/).filter(Boolean);
        const contentWords = content.split(/\s+/);
        const matched = keywords.some(k =>
          contentWords.some(w => w.includes(k) || k.includes(w))
        );
        if (!matched) {
          shouldWarn = true;
          reason = 'チャンネルと関係のない投稿';
        }
      }
    }

    // ✅ 警告される場合はここで一度だけログ出力
    if (shouldWarn) {
      console.log(`[DEBUG] guildId: ${guildId}`);
      console.log(`[DEBUG] チャンネル: ${channelName}`);
      console.log(`[DEBUG] 内容: ${content}`);
      console.log(`[DEBUG] shouldWarn: ${shouldWarn}, reason: ${reason}`);
    }

    if (!shouldWarn) return;

    // 警告カウント処理
    warnings[guildId] = warnings[guildId] || {};
    warnings[guildId][userId] = (warnings[guildId][userId] || 0) + 1;

    saveWarnings();

    const member = await message.guild.members.fetch(userId);

    // 警告ロール（自動作成・付与）
    let warningRole = message.guild.roles.cache.find(r => r.name === '⚠️警告中');
    if (!warningRole) {
      warningRole = await message.guild.roles.create({
        name: '⚠️警告中',
        color: 0xffaa00,
        reason: '警告用ロール自動作成'
      });
    }

    // ロール付与
    if (shouldWarn && !member.roles.cache.has(warningRole.id)) {
      await member.roles.add(warningRole);
    }

    const warnCount = warnings[guildId][userId];
    if (warnCount >= 10) {
      try {
        await member.timeout(60_000, '警告10回に達したため自動タイムアウト');
        warnings[guildId][userId] = 0; // リセット
        saveWarnings();
        return message.reply(`🚫 ${reason} により警告が10回に達し、1分間のタイムアウトを実行しました。`);
      } catch (err) {
        console.error('タイムアウトエラー:', err);
        return message.reply(`⚠️ ${reason} により警告されました（${warnCount}/10）※タイムアウト失敗`);
      }
    } else {
      return message.reply(`⚠️ ${reason} により警告されました（${warnCount}/10）`);
    }
  }
};

// 警告ファイルを保存
function saveWarnings() {
  try {
    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
  } catch (error) {
    console.error('警告ファイル書き込みエラー:', error);
  }
}
