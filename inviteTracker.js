const discord = require('discord.js')
let invitesCache = new Map();
module.exports = (client, logChannelId) => {
  client.on('ready', async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      const invites = await guild.invites.fetch().catch(() => new Map());
      invitesCache.set(guild.id, invites);
    }
  });

  client.on('inviteCreate', async invite => {
    const cached = invitesCache.get(invite.guild.id) || new Map();
    cached.set(invite.code, invite);
    invitesCache.set(invite.guild.id, cached);
  });

  client.on('guildMemberAdd', async member => {
    const cachedInvites = invitesCache.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();

    const used = newInvites.find(inv => {
      const cached = cachedInvites?.get(inv.code);
      return cached && inv.uses > cached.uses;
    });

    const inviter = used?.inviter;
    const embed = new discord.EmbedBuilder()
      .setTitle('✅ メンバー参加')
      .setDescription(`**${member.user.tag}** が参加しました`)
      .addFields(
        { name: '招待者', value: inviter ? `<@${inviter.id}> (${inviter.tag})` : '不明', inline: true },
        { name: '使用リンク', value: used?.code || '不明', inline: true }
      )
      .setColor(0x00cc66);

    const channel = await member.guild.channels.fetch(logChannelId).catch(() => null);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }

    // 更新
    invitesCache.set(member.guild.id, newInvites);
  });
};