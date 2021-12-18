const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'getstats',
	aliases: ['getinfo'],
	description: 'Shows statistics about a user.',
	long: 'Shows statistics about a user. Shows ban/tradeban information, donator information, warnings, account creation date, and other handy information.',
	args: {
		'User ID': 'ID of user to check.'
	},
	examples: ['getstats 168958344361541633'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		if (!userID) {
			return reply(message, '❌ You forgot to include a user ID.')
		}

		try {
			const row = await app.player.getRow(userID)

			const userInfo = await app.common.fetchUser(userID, { cacheIPC: false })
			const activeRows = await app.query('SELECT * FROM userguilds WHERE userId = ?', [userID])
			const warnings = await app.query('SELECT * FROM warnings WHERE userId = ?', [userID])
			const banned = await app.cd.getCD(userID, 'banned')
			const tradebanned = await app.cd.getCD(userID, 'tradeban')
			const kofiPatron = await app.cd.getCD(userID, 'patron')
			const patreonTier1Patron = await app.cd.getCD(userID, 'patron1')
			const patreonTier2Patron = await app.cd.getCD(userID, 'patron2')
			const patreonTier3Patron = await app.cd.getCD(userID, 'patron3')
			const patreonTier4Patron = await app.cd.getCD(userID, 'patron4')
			const discordAccCreated = codeWrap(`${new Date(Math.floor((userID / 4194304) + 1420070400000)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(Math.floor((userID / 4194304) + 1420070400000)).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix')
			const createdString = row ? codeWrap(`${new Date(row.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(row.createdAt).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix') : codeWrap('No Account', 'fix')
			const activeString = row ? codeWrap(`${new Date(row.lastActive).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(row.lastActive).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix') : codeWrap('Never', 'fix')

			const statEmbed = new app.Embed()
				.setColor('#ADADAD')
				.setAuthor(`${userInfo.username}#${userInfo.discriminator}`)
				.setThumbnail(app.common.getAvatar(userInfo))
				.addField('Joined Discord', discordAccCreated)
				.addField('Joined Lootcord', createdString, true)
				.addField('Last Active', activeString, true)
				.addField(`Activated in ${activeRows.length} servers`, codeWrap(activeRows.length > 0 ? activeRows.map(g => g.guildId).join('\n') : 'None', 'js'))

			if (warnings.length) {
				const warningsStr = []

				for (let i = 0; i < warnings.length; i++) {
					const moderator = await app.common.fetchUser(warnings[i].modId)

					warningsStr.push(`# Warning ${i + 1}\n> Moderator: ${moderator.username}#${moderator.discriminator}\n> Date: ${app.common.getShortDate(warnings[i].date)}\n> Reason:\n  ${warnings[i].reason}`)
				}

				statEmbed.addField('Warnings', codeWrap(`${warnings.length} total\n\n${warningsStr.join('\n\n')}`, 'md'))
			}
			else {
				statEmbed.addField('Warnings', codeWrap('None', ''))
			}

			if (banned) {
				const bannedRow = (await app.query('SELECT * FROM banned WHERE userId = ?', [userID]))[0]

				statEmbed.addField('Banned?', codeWrap(`Yes - Length:\n${banned}\n\n> Date: ${app.common.getShortDate(bannedRow.date)}\n> Reason:\n  ${bannedRow.reason}`, 'md'))
			}
			else {
				statEmbed.addField('Banned?', codeWrap('No', 'cs'))
			}

			if (tradebanned) {
				const bannedRow = (await app.query('SELECT * FROM tradebanned WHERE userId = ?', [userID]))[0]

				statEmbed.addField('Trade banned?', codeWrap(`Yes - Length:\n${tradebanned}\n\n> Date: ${app.common.getShortDate(bannedRow.date)}\n> Reason:\n  ${bannedRow.reason}`, 'md'))
			}
			else {
				statEmbed.addField('Trade banned?', codeWrap('No', 'cs'))
			}

			if (kofiPatron) {
				statEmbed.addField('Ko-fi Donator?', codeWrap(`Yes - Time Left:\n${kofiPatron}`, 'cs'))
			}

			if (patreonTier1Patron) {
				statEmbed.addField('Patreon Tier', codeWrap('Active - Tier 1 Donator', 'cs'))
			}

			if (patreonTier2Patron) {
				statEmbed.addField('Patreon Tier', codeWrap('Active - Tier 2 Donator', 'cs'))
			}

			if (patreonTier3Patron) {
				statEmbed.addField('Patreon Tier', codeWrap('Active - Tier 3 Donator', 'cs'))
			}

			if (patreonTier4Patron) {
				statEmbed.addField('Patreon Tier', codeWrap('Active - Tier 4 Donator', 'cs'))
			}

			await message.channel.createMessage(statEmbed)
		}
		catch (err) {
			await reply(message, `Error:\`\`\`${err}\`\`\``)
		}
	}
}

function codeWrap (input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}
