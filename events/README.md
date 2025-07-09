## 基本形
```js
import discord from 'discord.js';

export default {
  name: discord.Events.ClientReady, // イベント名
  async execute(client) { // イベントの引数
     // イベントの内容
     console.log('Hello World!');
  }
}
```
