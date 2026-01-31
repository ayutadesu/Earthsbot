// ReadableStreamのpolyfill
if (!global.ReadableStream) {
  const { ReadableStream } = require('web-streams-polyfill');
  global.ReadableStream = ReadableStream;
}
const a = require('./server.js');
const fs = require('fs');
const path = require('path');
const discord = require('discord.js');
const express = require('express');
const startAuditWatcher = require('./auditWatcher');
// Discordクライアント
const client = new discord.Client({
  intents: Object.values(discord.GatewayIntentBits)
});

global.client = client; // 他ファイルでも使えるように

// コマンドオブジェクト準備（ClientReadyより前に定義）
client.commands = new discord.Collection();

// ステータス設定
client.once(discord.Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity(`Made with <3 papapapaaa24, i5_xyz, mu_xyz`, {
    type: discord.ActivityType.Listening
  });
  
  
  // コマンドの登録
  const commands = [];
  
  try {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      try {
        const commandModule = require(`./commands/${file}`);
        
        // 配列かどうかをチェック
        if (Array.isArray(commandModule)) {
          // 配列の場合：各コマンドを処理
          for (const command of commandModule) {
            if (command && command.data && command.execute) {
              commands.push(command.data.toJSON());
              client.commands.set(command.data.name, command);
              console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
              console.error(`❌ Invalid command in array from ${file}`);
            }
          }
        } else if (commandModule && commandModule.data && commandModule.execute) {
          // 単一オブジェクトの場合
          commands.push(commandModule.data.toJSON());
          client.commands.set(commandModule.data.name, commandModule);
          console.log(`✅ Loaded command: ${commandModule.data.name}`);
        } else {
          console.error(`❌ Invalid command structure in ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error.message);
      }
    }
    
    await client.application.commands.set(commands);
    console.log(`✅ Successfully registered ${commands.length} commands.`);
    
  } catch (error) {
    console.error('❌ Error during command registration:', error);
  }
});

// イベント読み込み
try {
  const events = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
  for (const file of events) {
    try {
      const event = require(`./events/${file}`);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      console.log(`✅ Loaded event: ${event.name}`);
    } catch (error) {
      console.error(`❌ Error loading event ${file}:`, error.message);
    }
  }
} catch (error) {
  console.error('❌ Events folder not found or error reading events:', error.message);
}

// Interactionイベントハンドラ
client.on(discord.Events.InteractionCreate, async interaction => {
  try {
    // スラッシュコマンドの処理
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`コマンド未発見: ${interaction.commandName}`);
        return;
      }
      await command.execute(interaction);
    }
    
    // コンテキストメニューコマンドの処理
    else if (interaction.isContextMenuCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`コンテキストメニューコマンド未発見: ${interaction.commandName}`);
        return;
      }
      await command.execute(interaction);
    }
    
  } catch (error) {
    console.error('❌ Error executing interaction:', error);
    
    const errorMessage = 'コマンドの実行中にエラーが発生しました。';
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('❌ Error sending error message:', replyError);
    }
  }
});

// エラーハンドリング
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});


const trackInvites = require('./inviteTracker');

client.once('ready', () => {
  const logChannelId = '1388835311206924308'; // ←送信先チャンネルID
  startAuditWatcher(client, logChannelId);
  trackInvites(client, logChannelId);
  console.log('Bot ready and monitoring audit logs and invites.');
});

const cron = require('node-cron');
const birthdayCheck = require('./events/birthday.js');

// 毎日0時に実行
cron.schedule('0 0 * * *', () => {
  birthdayCheck(client);
});
cron.schedule('*/2 * * * *', () => {
    console.log("running...");
});

client.login(process.env.CLIENT_TOKEN);
