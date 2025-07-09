const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('指定した数のメッセージを削除します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option => option
      .setName('amount')
      .setDescription('削除するメッセージ数（1-100）')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    try {
      // まず応答して処理中であることを示す
      await interaction.deferReply({ ephemeral: true });

      // メッセージを削除
      const deletedMessages = await interaction.channel.bulkDelete(amount, true);
      
      // 削除されたメッセージ数を取得
      const deletedCount = deletedMessages.size;
      
      // 結果を報告
      const responseMessage = deletedCount > 0 
        ? `✅ ${deletedCount}件のメッセージを削除しました。`
        : '⚠️ 削除できるメッセージがありませんでした。（14日以上古いメッセージは削除できません）';

      await interaction.editReply({ content: responseMessage });

      // 5秒後に応答メッセージを削除
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          // 削除に失敗した場合は無視（既に削除されている可能性があるため）
          console.log('応答メッセージの削除に失敗:', error.message);
        }
      }, 5000);

    } catch (error) {
      console.error('メッセージ削除エラー:', error);
      
      // エラーメッセージの内容を詳細化
      let errorMessage = '❌ メッセージの削除中にエラーが発生しました。';
      
      if (error.code === 50034) {
        errorMessage = '❌ 14日以上古いメッセージは削除できません。';
      } else if (error.code === 50013) {
        errorMessage = '❌ メッセージを削除する権限がありません。';
      } else if (error.code === 10008) {
        errorMessage = '❌ 削除対象のメッセージが見つかりません。';
      }

      // deferReplyが既に実行されている場合とそうでない場合の処理
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};