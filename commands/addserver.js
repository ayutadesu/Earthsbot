if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// サーバー設定ファイルのパスを設定
const serverOptionPath = path.join(__dirname, '..', 'config', 'serverOption.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('サーバー管理コマンド')
    .setDefaultMemberPermissions(0x0000000000000008) // ADMINISTRATOR権限が必要
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('サーバーを有効リストに追加します')
        .addStringOption(option =>
          option
            .setName('server_id')
            .setDescription('追加するサーバーID（未指定の場合は現在のサーバー）')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('サーバーを無効リストに追加します')
        .addStringOption(option =>
          option
            .setName('server_id')
            .setDescription('追加するサーバーID（未指定の場合は現在のサーバー）')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('有効・無効サーバーリストを表示します')
    ),

  async execute(interaction) {
    // 管理者権限チェック
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ 
        content: '⚠️ このコマンドは管理者権限が必要です', 
        ephemeral: true 
      });
    }

    try {
      // サーバー設定ファイルを読み込む
      let serverOption;
      try {
        const configDir = path.dirname(serverOptionPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
          console.log(`ディレクトリを作成しました: ${configDir}`);
        }
        
        if (fs.existsSync(serverOptionPath)) {
          const data = fs.readFileSync(serverOptionPath, 'utf8');
          serverOption = JSON.parse(data);
        } else {
          serverOption = {
            enabledServers: [],
            disabledServers: []
          };
          fs.writeFileSync(serverOptionPath, JSON.stringify(serverOption, null, 2));
          console.log(`新しいファイルを作成しました: ${serverOptionPath}`);
        }
      } catch (error) {
        console.error('サーバー設定ファイル読み込みエラー:', error);
        serverOption = {
          enabledServers: [],
          disabledServers: []
        };
      }

      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'list') {
        const enabledList = serverOption.enabledServers.length > 0 
          ? serverOption.enabledServers.join('\n') 
          : 'なし';
        
        const disabledList = serverOption.disabledServers.length > 0 
          ? serverOption.disabledServers.join('\n') 
          : 'なし';
        
        return interaction.reply({
          content: `**有効サーバーリスト:**\n\`\`\`\n${enabledList}\n\`\`\`\n**無効サーバーリスト:**\n\`\`\`\n${disabledList}\n\`\`\``,
          ephemeral: true
        });
      }

      let targetServerId = interaction.options.getString('server_id');
      if (!targetServerId) {
        targetServerId = interaction.guildId;
      }

      if (!/^\d+$/.test(targetServerId)) {
        return interaction.reply({ 
          content: '⚠️ 無効なサーバーIDです。数字のみの文字列を入力してください。', 
          ephemeral: true 
        });
      }

      if (subcommand === 'enable') {
        if (serverOption.enabledServers.includes(targetServerId)) {
          return interaction.reply({ 
            content: `⚠️ サーバーID: \`${targetServerId}\` はすでに有効リストに登録されています。`, 
            ephemeral: true 
          });
        }

        serverOption.disabledServers = serverOption.disabledServers.filter(id => id !== targetServerId);
        serverOption.enabledServers.push(targetServerId);
        
        fs.writeFileSync(serverOptionPath, JSON.stringify(serverOption, null, 2));
        
        return interaction.reply({ 
          content: `✅ サーバーID: \`${targetServerId}\` を有効リストに追加しました！`, 
          ephemeral: true 
        });
      } 
      else if (subcommand === 'disable') {
        if (serverOption.disabledServers.includes(targetServerId)) {
          return interaction.reply({ 
            content: `⚠️ サーバーID: \`${targetServerId}\` はすでに無効リストに登録されています。`, 
            ephemeral: true 
          });
        }

        serverOption.enabledServers = serverOption.enabledServers.filter(id => id !== targetServerId);
        serverOption.disabledServers.push(targetServerId);
        
        fs.writeFileSync(serverOptionPath, JSON.stringify(serverOption, null, 2));
        
        return interaction.reply({ 
          content: `✅ サーバーID: \`${targetServerId}\` を無効リストに追加しました！`, 
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error('サーバー管理コマンドエラー:', error);
      return interaction.reply({ 
        content: '⚠️ コマンド実行中にエラーが発生しました。詳細はコンソールを確認してください。', 
        ephemeral: true 
      });
    }
  },
};
