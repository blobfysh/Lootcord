const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'addmod',
	aliases: [],
	description: 'Makes user a Lootcord moderator.',
	long: 'Makes user a Lootcord moderator.',
	args: {
		'User ID': 'ID of user to mod.'
	},
	examples: ['addmod 168958344361541633'],
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
		else if (await app.cd.getCD(userID, 'mod')) {
			return reply(message, '❌ User is already a moderator.')
		}

		const modMsg = new app.Embed()
			.setTitle(`😃 ${message.author.username}#${message.author.discriminator} made you a moderator!`)
			.setDescription('Use `t-modhelp` to see your fancy new commands!')
			.setFooter('You can use mod commands in the Lootcord Workshop moderator channel')
			.setColor(720640)

		try {
			const user = await app.common.fetchUser(userID, { cacheIPC: false })

			await app.cache.setNoExpire(`mod|${userID}`, 'Moderator')
			await app.query('INSERT INTO mods (userId) VALUES (?)', [userID])

			await app.common.messageUser(userID, modMsg, { throwErr: true })

			await reply(message, `Successfully modded **${user.username}#${user.discriminator}**!`)
		}
		catch (err) {
			await reply(message, `Error messaging user:\`\`\`\n${err}\`\`\``)
		}
	}
}
