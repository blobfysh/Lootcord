module.exports = {
	name: 'silentban',
	aliases: [''],
	description: 'Bans a user without notifying them.',
	long: 'Bans a user without notifying them. Banning will make the bot ignore every message from user.',
	args: {
		'User ID': 'ID of user to ban.',
		'reason': 'Reason for ban.'
	},
	examples: ['silentban 168958344361541633 cheating'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message) {
		const userID = message.args[0]
		const messageIn = message.args.slice(1).join(' ') || 'No reason provided.'

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}
		else if (await app.cd.getCD(userID, 'banned')) {
			return message.reply('❌ User is already banned.')
		}
		else if (await app.cd.getCD(userID, 'mod')) {
			return message.reply('Hey stop trying to ban a moderator!!! >:(')
		}

		const warnings = await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`)
		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		const botMessage = await message.reply(`**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue ban?`)

		try {
			const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

			if (confirmed) {
				try {
					await app.query('INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)', [userID, messageIn, new Date().getTime()])
					await app.cache.setNoExpire(`banned|${userID}`, 'Banned perma')

					botMessage.edit(`Successfully banned **${user.username}#${user.discriminator}**.`)
				}
				catch (err) {
					botMessage.edit(`Error banning user: \`\`\`js\n${err}\`\`\``)
				}
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit('❌ Timed out.')
		}
	}
}
