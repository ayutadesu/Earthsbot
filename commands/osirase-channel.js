const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
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
        return true;
    } catch (error) {
        console.error('設定ファイルの保存エラー:', error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-osirase-channel')
        .setDescription('お知らせを送信するチャンネルを設定します')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('お知らせチャンネルとして設定するチャンネル')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
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

            const channel = interaction.options.getChannel('channel');
            const guildId = interaction.guild.id;

            // ボットがチャンネルにメッセージを送信する権限があるかチェック
            if (!channel.permissionsFor(interaction.guild.members.me).has([
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.ViewChannel
            ])) {
                await interaction.editReply({
                    content: `❌ ${channel} にメッセージを送信する権限がありません。\nボットに以下の権限を付与してください：\n• チャンネルを見る\n• メッセージを送信\n• 埋め込みリンク`
                });
                return;
            }

            // 設定を読み込み
            const config = loadConfig();

            // サーバーの設定を初期化（存在しない場合）
            if (!config[guildId]) {
                config[guildId] = {};
            }

            // お知らせチャンネルを設定
            config[guildId].osiraseChannelId = channel.id;
            config[guildId].osiraseChannelName = channel.name;
            config[guildId].updatedAt = new Date().toISOString();
            config[guildId].updatedBy = interaction.user.id;

            // 設定を保存
            if (saveConfig(config)) {
                await interaction.editReply({
                    content: `✅ お知らせチャンネルを ${channel} に設定しました！\n\n📝 \`/osirase\` コマンドを使用してお知らせを送信できます。`
                });

                // テストメッセージを送信（オプション）
                try {
                    await channel.send({
                        content: '📢 **お知らせチャンネルに設定されました！**\n\`/osirase\` コマンドでお知らせを送信できます。',
                    });
                } catch (testError) {
                    console.error('テストメッセージ送信エラー:', testError);
                }

                console.log(`[設定] ${interaction.user.tag} が ${interaction.guild.name} のお知らせチャンネルを ${channel.name} に設定しました。`);
            } else {
                await interaction.editReply({
                    content: '❌ 設定の保存中にエラーが発生しました。再度お試しください。'
                });
            }

        } catch (error) {
            console.error('お知らせチャンネル設定エラー:', error);
            
            const errorMessage = interaction.replied || interaction.deferred
                ? 'editReply'
                : 'reply';
            
            await interaction[errorMessage]({
                content: '❌ 設定中にエラーが発生しました。再度お試しください。',
                flags: 64 // InteractionResponseFlags.Ephemeral
            });
        }
    },
};