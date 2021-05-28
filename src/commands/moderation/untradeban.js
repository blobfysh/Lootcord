const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'untradeban',
	aliases: [],
	description: 'Unbans a user from trading.',
	long: 'Lifts a user\'s tradeban.',
	args: {
		'User ID': 'ID of user to unban.'
	},
	examples: ['untradeban 168958344361541633'],
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
			return reply(message, 'Hey stop trying to ban a moderator!!! >:(')
		}
		else if (!await app.cd.getCD(userID, 'tradeban')) {
			return reply(message, '❌ That user is not banned')
		}

		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		const botMessage = await reply(message, {
			content: `Unban **${user.username}#${user.discriminator}**?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const banMsg = new app.Embed()
					.setTitle(`😃 Your tradeban was lifted by ${`${message.author.username}#${message.author.discriminator}`}`)
					.setColor(720640)
					.setFooter('https://lootcord.com/rules | Only moderators can send you messages.')

				try {
					await app.query(`DELETE FROM tradebanned WHERE userId ="${userID}"`)
					await app.cd.clearCD(userID, 'tradeban')

					await app.common.messageUser(userID, banMsg, { throwErr: true })

					await confirmed.respond({
						content: `Successfully lifted **${user.username}#${user.discriminator}**'s tradeban.`,
						components: []
					})
				}
				catch (err) {
					await confirmed.respond({
						content: `Unable to send message to user, they were still unbanned. \`\`\`js\n${err}\`\`\``,
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
