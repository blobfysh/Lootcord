module.exports = {
	name: 'clankick',
	aliases: [],
	description: 'Kick a user from a clan using ID.',
	long: 'Kick a user from a clan using their ID.',
	args: {
		'User ID': 'ID of user to kick.'
	},
	examples: ['clankick 168958344361541633'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}
		else if (await app.cd.getCD(userID, 'mod')) {
			return message.reply('Hey stop kick a moderator! >:(')
		}

		const userRow = await app.player.getRow(userID)

		if (!userRow) {
			return message.reply('❌ User has no account.')
		}
		else if (userRow.clanId === 0) {
			return message.reply('❌ User is not in a clan.')
		}

		const user = await app.common.fetchUser(userID, { cacheIPC: false })
		const clanRow = await app.clans.getRow(userRow.clanId)

		if (app.clan_ranks[userRow.clanRank].title === 'Leader') {
			const botMessage = await message.reply(`Kicking **${user.username}#${user.discriminator}** will disband \`${clanRow.name}\`. Continue?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					app.clans.disbandClan(userRow.clanId)

					botMessage.edit(`✅ Successfully disbanded \`${clanRow.name}\`.`)
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				botMessage.edit('❌ Timed out.')
			}
		}
		else {
			await app.query('UPDATE scores SET clanId = 0 WHERE userId = ?', [userID])
			await app.query('UPDATE scores SET clanRank = 0 WHERE userId = ?', [userID])

			message.reply(`✅ Successfully kicked **${user.username}#${user.discriminator}** from \`${clanRow.name}\`.`)
		}
	}
}
