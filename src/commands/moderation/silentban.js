const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'silentban',
	aliases: [],
	description: 'Bans a user without notifying them.',
	long: 'Bans a user without notifying them. Banning will make the bot ignore every message from user.',
	args: {
		'User ID': 'ID of user to ban.',
		'reason': 'Reason for ban.'
	},
	examples: ['silentban 168958344361541633 cheating'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]
		const messageIn = args.slice(1).join(' ') || 'No reason provided.'

		if (message.channel.id !== app.config.modChannel) {
			return reply(message, '❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return reply(message, '❌ You forgot to include a user ID.')
		}
		else if (await app.cd.getCD(userID, 'banned')) {
			return reply(message, '❌ User is already banned.')
		}
		else if (await app.cd.getCD(userID, 'mod')) {
			return reply(message, 'Hey stop trying to ban a moderator!!! >:(')
		}

		const warnings = await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`)
		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		const botMessage = await reply(message, {
			content: `**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue ban?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				try {
					await app.query('INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)', [userID, messageIn, new Date().getTime()])
					await app.cache.setNoExpire(`banned|${userID}`, 'Banned perma')

					await confirmed.respond({
						content: `Successfully banned **${user.username}#${user.discriminator}**.`,
						components: []
					})
				}
				catch (err) {
					await confirmed.respond({
						content: `Error banning user: \`\`\`js\n${err}\`\`\``,
						components: []
					})
				}
			}
			else {
				await botMessage.delete()
			}
		}
		catch (err) {
			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
