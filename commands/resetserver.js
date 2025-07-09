if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.resolve(__dirname, '../data/warnings.json');
const serverOptionPath = path.resolve(__dirname, '../data/serveroption.json');

// warnings.json が存在しない場合は初期化
let warnings = fs.existsSync(warningsPath) ? require(warningsPath) : {};
let serverOption = fs.existsSync(serverOptionPath) ? require(serverOptionPath) : { enabledServers: [], disabledServers: [] };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('サーバーの警告をリセットする'),
  async execute(interaction) {
    const guildId = interaction.guild.id;

    // サーバーが無効化されている場合、リセット処理をスキップ
    if (serverOption.disabledServers.includes(guildId)) {
      return interaction.reply({ content: 'このサーバーは無効化されており、警告リセットはできません。', ephemeral: true });
    }

    // 警告データをリセット
    if (warnings[guildId]) {
      delete warnings[guildId];  // 特定のサーバーの警告データを削除
      fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));  // 更新後のデータをファイルに保存
    }

    await interaction.reply({ content: '警告がリセットされました。', ephemeral: true });
  },
};
