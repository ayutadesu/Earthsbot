// zihanki-button.js - ボタンインタラクション処理
const discord2 = require('discord.js');
const { getUserData, setUserData, getInventoryData, consumeInventoryItem } = require('../utils/cache');
const { getItemInfo, getAllItemIds } = require('../utils/itemInfo');

module.exports = {
  name: discord2.Events.InteractionCreate,
  async execute(interaction) {
    const customid = interaction.customId;
    if (!interaction.isButton()) return;

    // 購入ボタン
    if (customid === "zihankibutton") {
      const inventory = getInventoryData(interaction.guild.id);
      const options = [];

      // 在庫のある商品のみセレクトメニューに追加
      for (const [itemId, items] of Object.entries(inventory)) {
        if (items.length > 0) {
          const itemInfo = getItemInfo(itemId);
          options.push(
            new discord2.StringSelectMenuOptionBuilder()
              .setLabel(itemInfo.name)
              .setDescription(`${itemInfo.price}円 (在庫: ${items.length}個)`)
              .setValue(itemId)
          );
        }
      }

      if (options.length === 0) {
        await interaction.reply({
          content: '申し訳ございません。現在在庫がありません。',
          ephemeral: true
        });
        return;
      }

      const select = new discord2.StringSelectMenuBuilder()
        .setCustomId('zihankidesu')
        .setPlaceholder('どれをご購入されますか？')
        .addOptions(options);

      const row = new discord2.ActionRowBuilder()
        .addComponents(select);

      await interaction.reply({
        content: '購入したい商品を選んでください',
        components: [row],
        ephemeral: true
      });
    }

    // 在庫確認ボタン
    if (customid === "ticketbutton") {
      const inventory = getInventoryData(interaction.guild.id);
      let inventoryText = "**現在の在庫状況:**\n\n";
      
      // 全商品について表示（在庫0も含む）
      const allItemIds = getAllItemIds();
      for (const itemId of allItemIds) {
        const itemInfo = getItemInfo(itemId);
        const stockCount = inventory[itemId] ? inventory[itemId].length : 0;
        inventoryText += `**${itemInfo.name}**\n価格: ${itemInfo.price}円\n在庫: ${stockCount}個\n\n`;
      }

      await interaction.reply({
        content: inventoryText,
        ephemeral: true
      });
    }

    // 在庫補充ボタン（管理者限定）- 直接モーダルを表示
    if (customid === "restockbutton") {
      if (!interaction.member.permissions.has(discord2.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: 'この機能は管理者限定です。',
          ephemeral: true
        });
        return;
      }

      // 直接モーダルを表示
      const modal = new discord2.ModalBuilder()
        .setCustomId('directRestockModal')
        .setTitle('在庫補充（新商品追加）');
      
      const itemName = new discord2.TextInputBuilder()
        .setCustomId('itemName')
        .setLabel("商品名")
        .setStyle(discord2.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('例: プロセカ石垢（10～12万クリスタル）');
      
      const itemPrice = new discord2.TextInputBuilder()
        .setCustomId('itemPrice')
        .setLabel("商品価格（コイン）")
        .setStyle(discord2.TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('例: 250');
      
      const itemContent = new discord2.TextInputBuilder()
        .setCustomId('itemContent')
        .setLabel("商品内容（アカウント情報など）")
        .setStyle(discord2.TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('例: ユーザー名: xxx\nパスワード: xxx');
      
      const quantity = new discord2.TextInputBuilder()
        .setCustomId('quantity')
        .setLabel("補充する個数")
        .setMaxLength(2)
        .setStyle(discord2.TextInputStyle.Short)
        .setValue('1')
        .setRequired(true);

      const firstActionRow = new discord2.ActionRowBuilder().addComponents(itemName);
      const secondActionRow = new discord2.ActionRowBuilder().addComponents(itemPrice);
      const thirdActionRow = new discord2.ActionRowBuilder().addComponents(itemContent);
      const fourthActionRow = new discord2.ActionRowBuilder().addComponents(quantity);
      
      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
      await interaction.showModal(modal);
    }

    // チケット閉じるボタン
    if (customid === "close") {
      await interaction.channel.delete();
    }
  }
};