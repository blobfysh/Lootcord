module.exports = {
	name: 'unmod',
	aliases: [],
	description: 'Take away moderator rights from a user.',
	long: 'Take away moderator rights from a user.',
	args: {
		'User ID': 'ID of user to unmod.'
	},
	examples: ['unmod 168958344361541633'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}
		else if (!await app.cd.getCD(userID, 'mod')) {
			return message.reply('❌ User is not a moderator.')
		}

		try {
			const user = await app.common.fetchUser(userID, { cacheIPC: false })

			await app.cd.clearCD(userID, 'mod')
			await app.query(`DELETE FROM mods WHERE userId ="${userID}"`)

			message.reply(`Successfully unmodded **${user.username}#${user.discriminator}**!`)
		}
		catch (err) {
			message.reply(`Error messaging user:\`\`\`\n${err}\`\`\``)
		}
	}
}
