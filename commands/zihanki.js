// zihanki.js - 自販機パネル作成コマンド
if (typeof ReadableStream === 'undefined') {
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill/ponyfill');
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;
  global.TransformStream = TransformStream;
}

const discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { getInventoryData } = require('../utils/cache');
const { getItemInfo } = require('../utils/itemInfo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("zihanki")
    .setDescription("自販機パネルを作成します。")
    .addStringOption(option => option
      .setName('title')
      .setDescription('パネルの題名を設定できます'))
    .addStringOption(option => option
      .setName('description')
      .setDescription('パネルの説明を設定できます！\\nで改行ができます')),
  
  async execute(interaction) {
    const { options } = interaction;
    let title = options.getString('title') || "自販機";
    let description = options.getString('description') || "商品を選択して購入してください！";

    // 在庫情報を取得して表示用の説明文を生成
    const inventory = getInventoryData(interaction.guild.id);
    let inventoryDisplay = "";
    
    for (const [itemId, items] of Object.entries(inventory)) {
      if (items.length > 0) {
        const itemInfo = getItemInfo(itemId);
        inventoryDisplay += `**${itemInfo.name}** - ${itemInfo.price}円 (在庫: ${items.length}個)\n`;
      }
    }
    
    if (inventoryDisplay) {
      description += "\n\n**現在の在庫:**\n" + inventoryDisplay;
    } else {
      description += "\n\n**現在在庫はありません**";
    }

    const zihankibutton = new discord.ButtonBuilder()
      .setCustomId("zihankibutton")
      .setLabel('購入する！🛒')
      .setStyle(discord.ButtonStyle.Success);

    const kakuninbutton = new discord.ButtonBuilder()
      .setCustomId("ticketbutton")
      .setLabel('在庫確認🔎')
      .setStyle(discord.ButtonStyle.Secondary);

    const restockbutton = new discord.ButtonBuilder()
      .setCustomId("restockbutton")
      .setLabel('在庫補充📦')
      .setStyle(discord.ButtonStyle.Primary);

    const actionRow = new discord.ActionRowBuilder()
      .addComponents([zihankibutton, kakuninbutton, restockbutton]);

    const embed = new discord.EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor("#1ABC9C")
      .setFooter({
        text: 'Zihanki Panel Create papapapaaa,mu_xyz', 
        iconURL: 'https://cdn.glitch.global/2f3d2bcc-f2cf-4c2a-8c46-a332446e0494/IMG_3139.png?v=1749992135607'
      });

    await interaction.reply({ embeds: [embed], components: [actionRow] });
  }
};