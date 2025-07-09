if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

require("dotenv").config();
const { Client, GatewayIntentBits, AuditLogEvent, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

// チャンネル作成・削除の監視
const channelCreationLog = new Map();

// 🔍 チャンネル削除の監視（荒らしの特定）
client.on("channelDelete", async (channel) => {
  const guild = channel.guild;

  try {
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
    const entry = auditLogs.entries.first();

    if (entry) {
      const user = entry.executor;

      if (user && !user.bot) {
        console.log(`⚠️ ユーザー ${user.tag} がチャンネルを削除しました。BANを試みます。`);
        await banUser(guild, user, "チャンネル削除による荒らし行為");
      }
    }
  } catch (error) {
    console.error("⚠️ チャンネル削除ログの取得中にエラー:", error);
  }
});

// 🔍 チャンネル作成の監視（短時間に大量作成 → BAN）
client.on("channelCreate", async (channel) => {
  const userId = channel.guild.ownerId; // サーバー管理者のID
  const guild = channel.guild;
  
  try {
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 });
    const entry = auditLogs.entries.first();

    if (entry) {
      const user = entry.executor;

      if (user && !user.bot && user.id !== userId) {
        const now = Date.now();

        if (!channelCreationLog.has(user.id)) {
          channelCreationLog.set(user.id, []);
        }

        const timestamps = channelCreationLog.get(user.id);
        timestamps.push(now);

        // 10秒以上前のログを削除
        while (timestamps.length > 0 && now - timestamps[0] > 10000) {
          timestamps.shift();
        }

        // 10秒以内に3つ以上のチャンネルを作成したらBAN
        if (timestamps.length >= 3) {
          console.log(`⚠️ ユーザー ${user.tag} が短時間にチャンネルを大量作成しました。BANを試みます。`);
          await banUser(guild, user, "短時間に複数のチャンネルを作成する荒らし行為");
        }
      }
    }
  } catch (error) {
    console.error("⚠️ チャンネル作成ログの取得中にエラー:", error);
  }
});

// 🚨 BAN処理関数
async function banUser(guild, user, reason) {
  try {
    if (guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await guild.members.ban(user, { reason });
      console.log(`✅ ユーザー ${user.tag} をBANしました: ${reason}`);
    } else {
      console.log("❌ BotにBAN権限がありません");
    }
  } catch (error) {
    console.error("❌ BAN中にエラーが発生:", error);
  }
}

