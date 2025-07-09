// zihanki-select.js - セレクトメニューとモーダル処理
const discord3 = require('discord.js');
const { getUserData, setUserData, getInventoryData, consumeInventoryItem, addInventoryItem } = require('../utils/cache');
const { getItemInfo } = require('../utils/itemInfo');

module.exports = {
  name: discord3.Events.InteractionCreate,
  async execute(interaction) {
    const customid = interaction.customId;

    // 購入セレクトメニュー
    if (interaction.isStringSelectMenu() && customid === 'zihankidesu') {
      global.selectedItem = interaction.values[0];
      global.selectedItemInfo = getItemInfo(global.selectedItem);

      const modal = new discord3.ModalBuilder()
        .setCustomId('purchaseModal')
        .setTitle('購入手続き');
      
      const conyukosuu = new discord3.TextInputBuilder()
        .setCustomId('quantity')
        .setLabel("いくつご購入されますか？")
        .setMaxLength(2)
        .setStyle(discord3.TextInputStyle.Short)
        .setValue('1');
      
      const payurl = new discord3.TextInputBuilder()
        .setCustomId('payurl')
        .setLabel("PayPayの送金URLを貼り付けてください")
        .setMinLength(11)
        .setStyle(discord3.TextInputStyle.Short);
      
      const firstActionRow = new discord3.ActionRowBuilder().addComponents(conyukosuu);
      const secondActionRow = new discord3.ActionRowBuilder().addComponents(payurl);
      
      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
    }

    // 在庫補充セレクトメニュー（既存商品用）
    if (interaction.isStringSelectMenu() && customid === 'restockselect') {
      global.restockItem = interaction.values[0];
      global.restockItemInfo = getItemInfo(global.restockItem);

      const modal = new discord3.ModalBuilder()
        .setCustomId('restockModal')
        .setTitle('在庫補充');
      
      const itemContent = new discord3.TextInputBuilder()
        .setCustomId('content')
        .setLabel("商品内容（アカウント情報など）")
        .setStyle(discord3.TextInputStyle.Paragraph)
        .setRequired(true);
      
      const quantity = new discord3.TextInputBuilder()
        .setCustomId('quantity')
        .setLabel("補充する個数")
        .setMaxLength(2)
        .setStyle(discord3.TextInputStyle.Short)
        .setValue('1');
      
      const firstActionRow = new discord3.ActionRowBuilder().addComponents(itemContent);
      const secondActionRow = new discord3.ActionRowBuilder().addComponents(quantity);
      
      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
    }

    // 購入モーダル送信処理
    if (interaction.isModalSubmit() && customid === "purchaseModal") {
      const targetUserId = "1093134961424474194"; // 管理者のユーザーID
      const quantity = parseInt(interaction.fields.getTextInputValue("quantity"));
      const payurl = interaction.fields.getTextInputValue("payurl");
      const guildId = interaction.guild.id;
      const userId = interaction.user.id;

      // 在庫チェック
      const inventory = getInventoryData(guildId);
      const availableItems = inventory[global.selectedItem] || [];
      
      if (availableItems.length < quantity) {
        await interaction.reply({
          content: `申し訳ございません。在庫が不足しています。（在庫: ${availableItems.length}個）`,
          ephemeral: true
        });
        return;
      }

      // コイン残高チェック
      const userData = getUserData(guildId, userId);
      const totalCost = global.selectedItemInfo.price * quantity;
      
      if (userData.coins < totalCost) {
        await interaction.reply({
          content: `コインが不足しています。必要: ${totalCost}コイン、現在: ${userData.coins}コイン`,
          ephemeral: true
        });
        return;
      }

      // チケットチャンネル作成
      const roleId = '1193475423699480667';
      const parentId = '1369371374396641421';
      
      const permissionOverwrites = [
        {
          id: interaction.guild.id,
          deny: [discord3.PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [discord3.PermissionsBitField.Flags.ViewChannel],
        }
      ];

      // ロールが存在する場合のみ権限を追加
      const role = interaction.guild.roles.cache.get(roleId);
      if (role) {
        permissionOverwrites.push({
          id: roleId,
          allow: [discord3.PermissionsBitField.Flags.ViewChannel],
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.tag}`,
        type: discord3.ChannelType.GuildText,
        parent: parentId,
        permissionOverwrites: permissionOverwrites,
      });

      const closeButton = new discord3.ActionRowBuilder()
        .addComponents(
          new discord3.ButtonBuilder()
            .setCustomId('close')
            .setEmoji('🔒')
            .setLabel('ticketを閉じる')
            .setStyle(discord3.ButtonStyle.Secondary),
          new discord3.ButtonBuilder()
            .setCustomId('confirm_purchase')
            .setEmoji('✅')
            .setLabel('購入確定')
            .setStyle(discord3.ButtonStyle.Success)
        );

      const embed = new discord3.EmbedBuilder()
        .setColor("Yellow")
        .setTitle("購入確認")
        .setDescription("管理者が購入を確定するまでお待ちください。");

      await channel.send({ embeds: [embed], components: [closeButton] });
      await channel.send(`${interaction.user}さんの購入チケットです。`);

      const purchaseInfo = new discord3.EmbedBuilder()
        .setTitle("購入情報")
        .setDescription(`商品: ${global.selectedItemInfo.name}\n数量: ${quantity}個\n合計金額: ${totalCost}コイン`)
        .setColor("#ff0000");

      await channel.send({ embeds: [purchaseInfo] });

      // 管理者にDM送信
      const adminEmbed = new discord3.EmbedBuilder()
        .setTitle("新しい購入リクエスト")
        .setDescription(`購入者: ${interaction.user.tag} (${interaction.user.id})\n商品: ${global.selectedItemInfo.name}\n数量: ${quantity}個\n合計: ${totalCost}コイン\nPayPay URL: ${payurl}\nチケット: ${channel}`)
        .setColor("#ff0000");

      const user = await global.client.users.fetch(targetUserId);
      await user.send({ embeds: [adminEmbed] });

      // 購入情報を一時保存
      global.pendingPurchases = global.pendingPurchases || {};
      global.pendingPurchases[channel.id] = {
        userId: userId,
        guildId: guildId,
        itemId: global.selectedItem,
        quantity: quantity,
        totalCost: totalCost
      };

      await interaction.reply({
        content: `購入リクエストを送信しました。${channel}で確認をお待ちください。`,
        ephemeral: true
      });
    }

    // 既存商品の在庫補充モーダル送信処理
    if (interaction.isModalSubmit() && customid === "restockModal") {
      if (!interaction.member.permissions.has(discord3.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: 'この機能は管理者限定です。',
          ephemeral: true
        });
        return;
      }

      const content = interaction.fields.getTextInputValue("content");
      const quantity = parseInt(interaction.fields.getTextInputValue("quantity"));
      const guildId = interaction.guild.id;

      // 在庫を追加
      for (let i = 0; i < quantity; i++) {
        addInventoryItem(guildId, global.restockItem, content);
      }

      await interaction.reply({
        content: `${global.restockItemInfo.name}を${quantity}個補充しました。`,
        ephemeral: true
      });
    }

    // 新しい商品の在庫補充モーダル送信処理
    if (interaction.isModalSubmit() && customid === "directRestockModal") {
      if (!interaction.member.permissions.has(discord3.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: 'この機能は管理者限定です。',
          ephemeral: true
        });
        return;
      }

      const itemName = interaction.fields.getTextInputValue("itemName");
      const itemPrice = parseInt(interaction.fields.getTextInputValue("itemPrice"));
      const content = interaction.fields.getTextInputValue("itemContent");
      const quantity = parseInt(interaction.fields.getTextInputValue("quantity"));
      const guildId = interaction.guild.id;

      // 商品名から一意のIDを生成（簡易的に）
      const itemId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // カスタム商品情報をグローバルに保存（本来はデータベースに保存すべき）
      if (!global.customItems) {
        global.customItems = {};
      }
      if (!global.customItems[guildId]) {
        global.customItems[guildId] = {};
      }
      global.customItems[guildId][itemId] = {
        name: itemName,
        price: itemPrice
      };

      // 在庫を追加
      for (let i = 0; i < quantity; i++) {
        addInventoryItem(guildId, itemId, content);
      }

      await interaction.reply({
        content: `新商品「${itemName}」を${quantity}個追加しました。\n価格: ${itemPrice}コイン`,
        ephemeral: true
      });
    }

    // 購入確定ボタン
    if (interaction.isButton() && customid === "confirm_purchase") {
      if (!interaction.member.permissions.has(discord3.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: 'この機能は管理者限定です。',
          ephemeral: true
        });
        return;
      }

      const channelId = interaction.channel.id;
      const purchaseData = global.pendingPurchases?.[channelId];

      if (!purchaseData) {
        await interaction.reply({
          content: '購入データが見つかりません。',
          ephemeral: true
        });
        return;
      }

      const { userId, guildId, itemId, quantity, totalCost } = purchaseData;

      // コインを消費
      const userData = getUserData(guildId, userId);
      userData.coins -= totalCost;
      setUserData(guildId, userId, userData);

      // 在庫から商品を取得してユーザーにDM送信
      const purchasedItems = [];
      for (let i = 0; i < quantity; i++) {
        const item = consumeInventoryItem(guildId, itemId);
        if (item) {
          purchasedItems.push(item);
        }
      }

      // 商品情報を取得（カスタム商品の場合も考慮）
      let itemInfo;
      if (global.customItems && global.customItems[guildId] && global.customItems[guildId][itemId]) {
        itemInfo = global.customItems[guildId][itemId];
      } else {
        itemInfo = getItemInfo(itemId);
      }

      // ユーザーにDM送信（embedは使わない）
      const buyer = await global.client.users.fetch(userId);
      let dmMessage = `購入ありがとうございます！\n\n`;
      dmMessage += `商品: ${itemInfo.name}\n`;
      dmMessage += `数量: ${quantity}個\n`;
      dmMessage += `合計: ${totalCost}コイン\n\n`;
      dmMessage += `商品内容:\n`;
      
      purchasedItems.forEach((item, index) => {
        dmMessage += `${index + 1}. ${item.content}\n`;
      });

      await buyer.send(dmMessage);

      await interaction.reply({
        content: '購入が確定されました。商品をユーザーに送信しました。',
        ephemeral: true
      });

      // 購入データを削除
      delete global.pendingPurchases[channelId];
    }
  }
};