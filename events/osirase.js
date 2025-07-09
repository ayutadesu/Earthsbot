const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 設定ファイルのパス
const configPath = path.join(__dirname, '..', 'config', 'osirase-config.json');

// 設定を読み込む関数
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('設定ファイルの読み込みエラー:', error);
    }
    return {};
}

// 設定を保存する関数
function saveConfig(config) {
    try {
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('設定ファイルの保存エラー:', error);
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // モーダル送信でない場合は無視
        if (!interaction.isModalSubmit()) return;
        
        // お知らせモーダルでない場合は無視
        if (interaction.customId !== 'osiraseModal') return;

        try {
            // 管理者権限をチェック
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: '❌ このコマンドを使用するには管理者権限が必要です。',
                    flags: 64 // InteractionResponseFlags.Ephemeral
                });
                return;
            }

            await interaction.deferReply({ flags: 64 }); // InteractionResponseFlags.Ephemeral

            // 設定を読み込み
            const config = loadConfig();
            const guildId = interaction.guild.id;

            // お知らせチャンネルが設定されているかチェック
            if (!config[guildId] || !config[guildId].osiraseChannelId) {
                await interaction.editReply({
                    content: '❌ お知らせチャンネルが設定されていません。\n管理者に `/set-osirase-channel` コマンドでお知らせチャンネルを設定してもらってください。'
                });
                return;
            }

            // お知らせチャンネルを取得
            const channelId = config[guildId].osiraseChannelId;
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                await interaction.editReply({
                    content: '❌ 設定されたお知らせチャンネルが見つかりません。チャンネルが削除されている可能性があります。'
                });
                return;
            }

            // ボットがチャンネルにメッセージを送信する権限があるかチェック
            if (!channel.permissionsFor(interaction.guild.members.me).has([
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks
            ])) {
                await interaction.editReply({
                    content: '❌ お知らせチャンネルにメッセージを送信する権限がありません。'
                });
                return;
            }

            // モーダルからお知らせ内容を取得
            const osiraseContent = interaction.fields.getTextInputValue('osiraseContent');

            // Embedを作成
            const osiraseEmbed = new EmbedBuilder()
                .setColor('#FF6B6B') // 赤っぽい色
                .setTitle('📢 お知らせ')
                .setDescription(osiraseContent)
                .setAuthor({
                    name: interaction.user.displayName,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp()
                .setFooter({
                    text: interaction.guild.name,
                    iconURL: interaction.guild.iconURL()
                });

            // お知らせを送信
            const sentMessage = await channel.send({ embeds: [osiraseEmbed] });

            // 成功メッセージを送信
            await interaction.editReply({
                content: `✅ お知らせを送信しました！\n📍 チャンネル: ${channel}\n🔗 [メッセージへのリンク](${sentMessage.url})`
            });

            // ログを出力
            console.log(`[お知らせ] ${interaction.user.tag} (${interaction.user.id}) が ${interaction.guild.name} の ${channel.name} にお知らせを送信しました。`);

        } catch (error) {
            console.error('お知らせ送信エラー:', error);
            
            const errorMessage = interaction.replied || interaction.deferred
                ? 'editReply'
                : 'reply';
            
            await interaction[errorMessage]({
                content: '❌ お知らせの送信中にエラーが発生しました。再度お試しください。',
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }
    },
};