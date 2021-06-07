const { CLANS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'info',
	aliases: ['i', 'inf'],
	description: 'Show information about a clan.',
	long: 'Shows information about a clan.',
	args: { 'clan/user': 'Clan or user to search, will default to your own clan if none specified.' },
	examples: ['clan info Mod Squad'],
	requiresClan: false,
	requiresActive: false,
	minimumRank: 0,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const mentionedUser = app.parse.members(message, args)[0]

		if (!args.length && scoreRow.clanId === 0) {
			return reply(message, 'You are not a member of any clan! You can look up other clans by searching their name.')
		}
		else if (!args.length) {
			await getClanInfo(app, message, scoreRow.clanId, serverSideGuildId)
		}
		else if (mentionedUser) {
			const invitedScoreRow = await app.player.getRow(mentionedUser.id, serverSideGuildId)

			if (!invitedScoreRow) {
				return reply(message, '❌ The person you\'re trying to search doesn\'t have an account!')
			}
			else if (invitedScoreRow.clanId === 0) {
				return reply(message, '❌ That user is not in a clan.')
			}

			await getClanInfo(app, message, invitedScoreRow.clanId, serverSideGuildId)
		}
		else {
			const clanName = args.join(' ')
			const clanRow = await app.clans.searchClanRow(clanName, serverSideGuildId)

			if (!clanRow) {
				return reply(message, 'I could not find a clan with that name! Maybe you misspelled it?')
			}

			await getClanInfo(app, message, clanRow.clanId, serverSideGuildId)
		}
	}
}

async function getClanInfo (app, message, clanId, serverSideGuildId) {
	const clanRow = await app.clans.getRow(clanId, serverSideGuildId)
	const clanMembers = await app.clans.getMembers(clanId, serverSideGuildId)
	const clanData = await app.clans.getClanData(clanRow, await app.clans.getItemObject(clanId, serverSideGuildId), serverSideGuildId)
	const upkeep = app.clans.getUpkeep(clanRow.level, clanRow.money, clanMembers.count, clanData.inactiveMemberCount)
	const raidCD = await app.cd.getCD(clanId, 'raid', { serverSideGuildId })
	const raidedCD = await app.cd.getCD(clanId, 'raided', { serverSideGuildId })

	const baseEmbed = new app.Embed()
	baseEmbed.setColor(13451564)
	baseEmbed.setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
	baseEmbed.setTitle('Info')
	baseEmbed.setDescription(clanRow.status !== '' ? clanRow.status : 'This clan is too mysterious for a status...')

	if (raidCD) {
		baseEmbed.addField('Raid Timer', `This clan cannot raid for \`${raidCD}\`.`)
	}
	if (raidedCD) {
		baseEmbed.addField('Recently Raided', `This clan just got raided and cannot be raided again for \`${raidedCD}\`.`)
	}

	// clan image
	if (clanRow.iconURL) {
		baseEmbed.setThumbnail(clanRow.iconURL)
	}
	else {
		baseEmbed.setThumbnail(CLANS.levels[clanRow.level].image)
	}

	baseEmbed.addField('Health', `**${clanRow.health} / ${clanRow.maxHealth}** HP\n${app.player.getHealthIcon(clanRow.health, clanRow.maxHealth)}`, true)
	baseEmbed.addField('Clan Stats', `Level: **${clanRow.level} (${CLANS.levels[clanRow.level].type})**\nItems in storage: **${clanData.itemCount} / ${clanData.vaultSlots}**`, true)
	baseEmbed.addBlankField()
	baseEmbed.addField('Scrap Bank', `${app.common.formatNumber(clanRow.money)} / ${app.common.formatNumber(CLANS.levels[clanRow.level].bankLimit, true)} max`, true)

	let upkeepStr = app.common.formatNumber(upkeep)

	if (clanRow.money < upkeep) {
		upkeepStr += '\n\n⚠ **This clan is decaying.**\nItems will be lost from the clan if upkeep is not paid tonight!'
	}
	else if (clanData.inactiveMemberCount > Math.floor(clanData.memberCount / 2)) {
		upkeepStr += '\n\n⚠ **This clan is decaying.**\nThe upkeep is greatly increased because half or more members are inactive!'
	}

	baseEmbed.addField('Daily Upkeep', upkeepStr, true)
	baseEmbed.addField(`Members (${clanMembers.count})`, `${app.icons.loading} Loading members...`)
	baseEmbed.setFooter(`Founded ${getShortDate(clanRow.clanCreated)}`)

	const loadingMsg = await message.channel.createMessage(baseEmbed)

	const membersRanksList = []

	for (let i = 0; i < clanMembers.count; i++) {
		const clanUser = await app.common.fetchUser(clanMembers.memberIds[i], { cacheIPC: false })
		const clanUserRow = await app.player.getRow(clanMembers.memberIds[i], serverSideGuildId)

		if (clanUser.id === message.author.id) {
			membersRanksList.push([`${i + 1}. **${app.clan_ranks[clanUserRow.clanRank].title} ${app.player.getBadge(clanUserRow.badge)} ${clanUser.username}#${clanUser.discriminator}**`, clanUserRow.clanRank])
		}
		else if (app.clan_ranks[clanUserRow.clanRank].title === 'Leader') {
			membersRanksList.push([`${i + 1}. ${app.icons.clan_leader_crown} ${app.clan_ranks[clanUserRow.clanRank].title} ${app.player.getBadge(clanUserRow.badge)} ${clanUser.username}#${clanUser.discriminator}`, clanUserRow.clanRank])
		}
		else {
			membersRanksList.push([`${i + 1}. ${app.clan_ranks[clanUserRow.clanRank].title} ${app.player.getBadge(clanUserRow.badge)} ${clanUser.username}#${clanUser.discriminator}`, clanUserRow.clanRank])
		}
	}

	baseEmbed.embed.fields.pop() // remove members field

	baseEmbed.addField(`Members (${clanMembers.count})`, membersRanksList.map(member => member[0]).join('\n'))

	setTimeout(() => {
		loadingMsg.edit(baseEmbed)
	}, 1000)
}

function getShortDate (date) {
	let convertedTime = new Date(date).toLocaleString('en-US', {
		timeZone: 'America/New_York'
	})
	convertedTime = new Date(convertedTime).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})

	return convertedTime
}
