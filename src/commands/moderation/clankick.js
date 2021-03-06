const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'clankick',
	aliases: [],
	description: 'Kick a user from a clan using ID.',
	long: 'Kick a user from a clan using their ID.',
	args: {
		'User ID': 'ID of user to kick.'
	},
	examples: ['clankick 168958344361541633'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		if (message.channel.id !== app.config.modChannel) {
			return reply(message, '❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return reply(message, '❌ You forgot to include a user ID.')
		}
		else if (await app.cd.getCD(userID, 'mod')) {
			return reply(message, 'Hey stop kick a moderator! >:(')
		}

		const userRow = await app.player.getRow(userID)

		if (!userRow) {
			return reply(message, '❌ User has no account.')
		}
		else if (userRow.clanId === 0) {
			return reply(message, '❌ User is not in a clan.')
		}

		const user = await app.common.fetchUser(userID, { cacheIPC: false })
		const clanRow = await app.clans.getRow(userRow.clanId)

		if (app.clan_ranks[userRow.clanRank].title === 'Leader') {
			const botMessage = await reply(message, {
				content: `Kicking **${user.username}#${user.discriminator}** will disband \`${clanRow.name}\`. Continue?`,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					app.clans.disbandClan(userRow.clanId)

					await confirmed.respond({
						content: `✅ Successfully disbanded \`${clanRow.name}\`.`,
						components: []
					})
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				await botMessage.edit({
					content: '❌ Command timed out.',
					components: []
				})
			}
		}
		else {
			await app.query('UPDATE scores SET clanId = 0 WHERE userId = ?', [userID])
			await app.query('UPDATE scores SET clanRank = 0 WHERE userId = ?', [userID])

			await reply(message, `✅ Successfully kicked **${user.username}#${user.discriminator}** from \`${clanRow.name}\`.`)
		}
	}
}
