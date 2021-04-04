module.exports = {
	name: 'info',
	aliases: ['i', 'inf'],
	description: 'Show information about a clan.',
	long: 'Shows information about a clan.',
	args: { 'clan/user': 'Clan or user to search, will default to your own clan if none specified.' },
	examples: ['clan info Mod Squad'],
	requiresClan: false,
	requiresActive: false,
	minimumRank: 0,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const mentionedUser = app.parse.members(message, args)[0]

		if (!args.length && scoreRow.clanId === 0) {
			return message.reply('You are not a member of any clan! You can look up other clans by searching their name.')
		}
		else if (!args.length) {
			await getClanInfo(app, message, scoreRow.clanId)
		}
		else if (mentionedUser) {
			const invitedScoreRow = await app.player.getRow(mentionedUser.id)

			if (!invitedScoreRow) {
				return message.reply('❌ The person you\'re trying to search doesn\'t have an account!')
			}
			else if (invitedScoreRow.clanId === 0) {
				return message.reply('❌ That user is not in a clan.')
			}

			await getClanInfo(app, message, invitedScoreRow.clanId)
		}
		else {
			const clanName = args.join(' ')
			const clanRow = await app.clans.searchClanRow(clanName)

			if (!clanRow) {
				return message.reply('I could not find a clan with that name! Maybe you misspelled it?')
			}

			await getClanInfo(app, message, clanRow.clanId)
		}
	}
}

async function getClanInfo(app, message, clanId) {
	const clanRow = await app.clans.getRow(clanId)
	const clanMembers = await app.clans.getMembers(clanId)
	const clanPower = await app.clans.getClanData(clanRow)
	const upkeep = app.clans.getUpkeep(clanRow.money, clanMembers.count, clanPower.inactiveMemberCount)
	const raidCD = await app.cd.getCD(clanId, 'raid')
	const raidedCD = await app.cd.getCD(clanId, 'raided')

	const baseEmbed = new app.Embed()
	baseEmbed.setColor('#e6b8e9')
	baseEmbed.setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
	baseEmbed.setTitle('Info')
	baseEmbed.setDescription(clanRow.status !== '' ? clanRow.status : 'This clan is too mysterious for a status...')

	if (raidCD) {
		baseEmbed.addField('Raid Timer', `This clan cannot raid for \`${raidCD}\`.`)
	}
	if (raidedCD) {
		baseEmbed.addField('Recently Raided', `This clan just got raided and cannot be raided again for \`${raidedCD}\`.`)
	}
	if (clanRow.iconURL) {
		baseEmbed.setThumbnail(clanRow.iconURL)
	}

	if (clanRow.reduction > 0) {
		baseEmbed.addField('Clan Power\n(Used / Current / Max)',
			`${clanPower.usedPower} / 💥 ${clanPower.currPower} / ${clanPower.maxPower}\n\n- **${clanPower.usedPower}** items in the clan vault, using ${clanPower.usedPower} power.\n- **${clanPower.currPower + clanRow.reduction}** current cumulative power among members minus 💥 **${clanRow.reduction}** power from explosions.\n- **${clanPower.maxPower}** maximum possible power (if every member had 5 power).`,
			true)
	}
	else {
		baseEmbed.addField('Clan Power\n(Used / Current / Max)',
			`${clanPower.usedPower} / ${clanPower.currPower} / ${clanPower.maxPower}\n\n- **${clanPower.usedPower}** items in the clan vault, using ${clanPower.usedPower} power.\n- **${clanPower.currPower}** current cumulative power among members (5 per member).\n- **${clanPower.maxPower}** maximum possible power (if every member had 5 power).`,
			true)
	}

	baseEmbed.addField('Member Stats', `${`${clanPower.kills} kills | ${clanPower.deaths} deaths`}\n${app.cd.convertTime(clanPower.playtime)} of total playtime`, true)
	baseEmbed.addBlankField()
	baseEmbed.addField('Bank', `${app.common.formatNumber(clanRow.money)} / ${app.common.formatNumber(app.clans.getBankLimit(clanMembers.count), true)} max`, true)

	let upkeepStr = app.common.formatNumber(upkeep)

	if (clanRow.money < upkeep) {
		upkeepStr += '\n\n⚠ **This clan is decaying.**\nItems will be lost from the vault if upkeep is not paid tonight!'
	}
	else if (clanPower.inactiveMemberCount > Math.floor(clanPower.memberCount / 2)) {
		upkeepStr += '\n\n⚠ **This clan is decaying.**\nThe upkeep is greatly increased because half or more members are inactive!'
	}

	baseEmbed.addField('Daily Upkeep', upkeepStr, true)
	baseEmbed.addField(`Members (${clanMembers.count})`, `${app.icons.loading} Loading members...`)
	baseEmbed.setFooter(`Founded ${getShortDate(clanRow.clanCreated)}`)

	const loadingMsg = await message.channel.createMessage(baseEmbed)

	const membersRanksList = []

	for (let i = 0; i < clanMembers.count; i++) {
		const clanUser = await app.common.fetchUser(clanMembers.memberIds[i], { cacheIPC: false })
		const clanUserRow = await app.player.getRow(clanMembers.memberIds[i])

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

function getShortDate(date) {
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
