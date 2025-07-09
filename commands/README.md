## 基本形
```js
import discord from 'discord.js';

export default {
  // コマンドの情報を入力する
  data: new discord.SlashCommandBuilder()
    .setName('Command Name')
    .setDescription('Command Description')
  ,
  async execute(interaction) {
    // コマンドの内容を入力する
    await interaction.reply('Hello World!');
  }
};
```
## コマンド情報の発展
- 実行権限を設定
```js
.setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator)
```
`discord.PermissionFlagsBits.Administrator`は権限名。他のものにも変更可能

- オプションを追加
```js
.addStringOption(option => option // Stringの部分はIntegerやChannelなどに変更可能
  .setName('option_name')
  .setDescription('option_description')
  .setRequired(true) // trueで必須、falseで任意
)
```
