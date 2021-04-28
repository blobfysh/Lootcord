exports.command = {
	name: 'getclan',
	aliases: ['getclaninfo', 'getclanid'],
	description: 'Get metadata of a clan.',
	long: 'Get metadata of a clan using the name. Will retrieve the clan\'s ID and all member ID\'s.',
	args: {
		clan: 'Clan to search.'
	},
	examples: ['getclan Mod Squad'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const clanName = args.join(' ')
		const clanRow = await app.clans.searchClanRow(clanName)

		if (!clanRow) {
			return message.reply('❌ A clan with that name does not exist.')
		}

		const clanMembers = await app.clans.getMembers(clanRow.clanId)

		const membersRanksList = []

		for (let i = 0; i < clanMembers.count; i++) {
			const clanUser = await app.common.fetchUser(clanMembers.memberIds[i], { cacheIPC: false })
			const clanUserRow = await app.player.getRow(clanMembers.memberIds[i])

			if (app.clan_ranks[clanUserRow.clanRank].title === 'Leader') {
				membersRanksList.push([` - ${app.icons.clan_leader_crown} ${app.clan_ranks[clanUserRow.clanRank].title} ${app.player.getBadge(clanUserRow.badge)} ${clanUser.username}#${clanUser.discriminator} (\`${clanMembers.memberIds[i]}\`)`, clanUserRow.clanRank])
			}
			else {
				membersRanksList.push([` - ${app.clan_ranks[clanUserRow.clanRank].title} ${app.player.getBadge(clanUserRow.badge)} ${clanUser.username}#${clanUser.discriminator} (\`${clanMembers.memberIds[i]}\`)`, clanUserRow.clanRank])
			}
		}

		membersRanksList.sort((a, b) => b[1] - a[1]) // Sort clan members by rank.

		const baseEmbed = new app.Embed()
			.setColor(13451564)
			.setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
			.addField('Clan ID', `\`\`\`\n${clanRow.clanId}\`\`\``)
			.addField(`Members (${clanMembers.count})`, membersRanksList.map(member => member[0]).join('\n'))

		message.channel.createMessage(baseEmbed)
	}
}
