exports.command = {
	name: 'unban',
	aliases: [],
	description: 'Unbans a user.',
	long: 'Unbans a user and sends them a message that they were unbanned.',
	args: {
		'User ID': 'ID of user to unban.'
	},
	examples: ['unban 168958344361541633'],
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
			return message.reply('Hey stop trying to ban a moderator!!! >:(')
		}
		else if (!await app.cd.getCD(userID, 'banned')) {
			return message.reply('❌ That user is not banned')
		}

		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		const botMessage = await message.reply(`Unban **${user.username}#${user.discriminator}**?`)

		try {
			const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

			if (confirmed) {
				const banMsg = new app.Embed()
					.setTitle(`😃 You have been unbanned by ${`${message.author.username}#${message.author.discriminator}`}`)
					.setColor(720640)
					.setFooter('https://lootcord.com/rules | Only moderators can send you messages.')

				try {
					await app.query(`DELETE FROM banned WHERE userId ="${userID}"`)
					await app.cd.clearCD(userID, 'banned')

					await app.common.messageUser(userID, banMsg, { throwErr: true })
					botMessage.edit(`Successfully unbanned **${user.username}#${user.discriminator}**.`)
				}
				catch (err) {
					botMessage.edit(`Unable to send message to user, they were still unbanned. \`\`\`js\n${err}\`\`\``)
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
