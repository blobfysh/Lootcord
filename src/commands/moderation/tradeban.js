const { RULES, BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'tradeban',
	aliases: [],
	description: 'Bans a user from trading.',
	long: 'Bans a user from being able to use the trade command as well as the black market, clan deposit/withdraw, and Discoin conversions. You must provide one of the following rules:\n\n**1** - Bug exploitation\n**2** - Alt accounts\n**3** - Leaving servers to avoid deactivate cooldown\n**4** - Kill-farming\n**5** - False reports',
	args: {
		'User ID': 'ID of user to ban.',
		'rule': 'Rule broken.'
	},
	examples: ['tradeban 168958344361541633 5'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]
		const rule = args[1]

		if (message.channel.id !== app.config.modChannel) {
			return reply(message, '❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return reply(message, '❌ You forgot to include a user ID.')
		}
		else if (!rule || !Object.keys(RULES).includes(rule)) {
			return reply(message, '❌ You need to specify what rule was broken:\n\n**1** - Bug exploitation\n**2** - Alt accounts\n**3** - Leaving servers to avoid deactivate cooldown\n**4** - Kill-farming\n**5** - False reports')
		}
		else if (await app.cd.getCD(userID, 'mod')) {
			return reply(message, 'Hey stop trying to ban a moderator!!! >:(')
		}

		const warnings = await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`)
		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		const botMessage = await reply(message, {
			content: `**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue ban for **${RULES[rule].desc}**?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const banMsg = new app.Embed()
					.setTitle(`You were banned from trading by ${`${message.author.username}#${message.author.discriminator}`}`)
					.setDescription(`You have been banned from trading for breaking rules. If you wish to challenge this ban, you can appeal at our website.\`\`\`\n${RULES[rule].warn_message}\`\`\``)
					.setColor(16734296)
					.setFooter('https://lootcord.com/rules | Only moderators can send you messages.')

				try {
					await app.query('INSERT INTO tradebanned (userId, reason, date) VALUES (?, ?, ?)', [userID, RULES[rule].warn_message, new Date().getTime()])
					await app.cache.setNoExpire(`tradeban|${userID}`, 'Banned perma')

					await app.common.messageUser(userID, banMsg, { throwErr: true })

					await confirmed.respond({
						content: `Successfully banned **${user.username}#${user.discriminator}** from trading.`,
						components: []
					})
				}
				catch (err) {
					await confirmed.respond({
						content: `Unable to send message to user, they were still banned. \`\`\`js\n${err}\`\`\``,
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
