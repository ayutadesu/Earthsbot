const { EmbedBuilder, AuditLogEvent } = require('discord.js');

let lastChecked = new Map();

module.exports = async function startAuditWatcher(client, targetChannelId) {
  setInterval(async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const fetched = await guild.fetchAuditLogs({ limit: 5 });
        const entries = fetched.entries;

        if (!entries || entries.size === 0) continue;

        const lastId = lastChecked.get(guildId);

        for (const entry of entries.values()) {
          if (lastId && entry.id === lastId) break;

          // 👇 BANやキックのみ通す
          if (![AuditLogEvent.MemberKick, AuditLogEvent.MemberBanAdd].includes(entry.action)) continue;

          const embed = new EmbedBuilder()
            .setTitle(`🚨 ${entry.action === AuditLogEvent.MemberKick ? 'メンバーキック' : 'BAN実行'}`)
            .setDescription(`**対象:** ${entry.target?.tag || entry.target?.username || '不明'} (${entry.targetId})`)
            .addFields(
              { name: '実行者', value: `<@${entry.executor.id}> (${entry.executor.tag})`, inline: true },
              { name: '日時', value: `<t:${Math.floor(entry.createdTimestamp / 1000)}:F>`, inline: true }
            )
            .setColor(entry.action === AuditLogEvent.MemberKick ? 0xff9900 : 0xff0000)
            .setFooter({ text: `Log ID: ${entry.id}` });

          const logChannel = await guild.channels.fetch(targetChannelId).catch(() => null);
          if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [embed] });
          }
        }

        lastChecked.set(guildId, entries.first().id);

      } catch (err) {
        console.error(`❌ Audit log error for guild ${guild.name}:`, err);
      }
    }
  }, 15000);
};