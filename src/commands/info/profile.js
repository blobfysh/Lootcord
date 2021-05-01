exports.command = {
	name: 'profile',
	aliases: ['p', 'kills', 'deaths', 'banners'],
	description: 'Check your stats.',
	long: 'Displays a users profile. Shows their stats, currently equipped items and their status.',
	args: {
		'@user/discord#tag': 'User\'s profile to check.'
	},
	examples: ['profile blobfysh#4679'],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const memberArg = app.parse.members(message, args)[0]

		if (!memberArg) {
			if (args.length) {
				message.reply('❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID')
				return
			}

			message.reply(await makeProfile(app, message.author, serverSideGuildId))
		}
		else {
			message.reply(await makeProfile(app, memberArg, serverSideGuildId))
		}
	}
}

function codeWrap(input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}

const makeProfile = exports.makeProfile = async function makeProfile(app, user, serverSideGuildId) {
	try {
		const userRow = await app.player.getRow(user.id, serverSideGuildId)

		if (!userRow) {
			return {
				content: '❌ The person you\'re trying to search doesn\'t have an account!'
			}
		}

		const userItems = await app.itm.getUserItems(await app.itm.getItemObject(user.id, serverSideGuildId), { onlyBanners: true })
		const badges = await app.itm.getBadges(user.id, serverSideGuildId)
		const xp = app.common.calculateXP(userRow.points, userRow.level)
		const trivias = await app.player.getStat(user.id, 'trivias', serverSideGuildId)
		const triviasCorrect = await app.player.getStat(user.id, 'triviasCorrect', serverSideGuildId)
		const scrambles = await app.player.getStat(user.id, 'scrambles', serverSideGuildId)
		const scramblesCorrect = await app.player.getStat(user.id, 'scramblesCorrect', serverSideGuildId)

		const bannerIcon = app.itemdata[userRow.banner] !== undefined ? app.itemdata[userRow.banner].icon : ''
		const bannersList = `**Equipped:** ${bannerIcon}\`${userRow.banner}\`\n${userItems.banners.join('\n')}`
		let userStatus = 'Change your status with the `setstatus` command!'
		let badgeList = ''
		let healthStr = `**${userRow.health} / ${userRow.maxHealth}** HP${app.player.getHealthIcon(userRow.health, userRow.maxHealth, true)}`

		if (userRow.bleed > 0) {
			healthStr += `\n🩸 Bleeding: **${userRow.bleed}**`
		}
		if (userRow.burn > 0) {
			healthStr += `\n🔥 Burning: **${userRow.burn}**`
		}

		if (userRow.status !== '') {
			userStatus = userRow.status
		}

		if (badges.length) {
			if (userRow.badge !== 'none') {
				badgeList = `**Display**: ${app.badgedata[userRow.badge].icon}\`${userRow.badge}\`\n`
			}

			badgeList += badges.sort().filter(badge => badge !== userRow.badge).map(badge => `${app.badgedata[badge].icon}\`${badge}\``).join('\n')
		}
		else {
			badgeList = 'None'
		}

		const profileEmbed = new app.Embed()
			.setColor(13451564)
			.setAuthor(`${user.username}#${user.discriminator}'s Profile`, app.common.getAvatar(user))
			.setDescription(userStatus)
			.addField('Clan', codeWrap(userRow.clanId !== 0 ? (await app.clans.getRow(userRow.clanId)).name : 'None', 'js'), true)
			.addField('Level', codeWrap(`${userRow.level} (${xp.curLvlXp} / ${xp.neededForLvl})`, 'js'), true)
			.addField('Power', codeWrap(`${userRow.power} / ${userRow.max_power} Power`, 'js'), true)
			.addField('K/D Ratio', userRow.deaths === 0 ? `${userRow.kills} Kills\n${userRow.deaths} Deaths (${userRow.kills} K/D)\n` : `${userRow.kills} Kills\n${userRow.deaths} Deaths (${(userRow.kills / userRow.deaths).toFixed(2)} K/D)`, true)
			.addField('Trivia Stats', `Attempts: ${trivias}\nCorrect: ${triviasCorrect}`, true)
			.addField('Scramble Stats', `Attempts: ${scrambles}\nCorrect: ${scramblesCorrect}`, true)
			.addField('Health', healthStr, true)
			.addField('Strength', `${parseFloat(userRow.scaledDamage).toFixed(2)}x damage`, true)
			.addField('Luck', userRow.luck.toString(), true)
			.addField('Banners', bannersList, true)
			.addField('Badges', badgeList, true)
			.setFooter(`🌟 Skills upgraded ${userRow.used_stats} times`)

		if (userRow.banner !== 'none') {
			profileEmbed.setImage(app.itemdata[userRow.banner].image)
			profileEmbed.setColor(app.itemdata[userRow.banner].bannerColor)
		}

		return {
			embed: profileEmbed.embed
		}
	}
	catch (err) {
		console.log(err)
		return {
			content: '❌ There was an error trying to fetch profile. Make sure you mention the user.'
		}
	}
}
