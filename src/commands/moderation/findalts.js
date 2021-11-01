const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'findalts',
	aliases: [],
	description: 'Attempt to find alts of a user.',
	long: 'Attempt to find alts of a user.',
	args: {
		'User ID': 'ID of user to check.'
	},
	examples: ['findalts 168958344361541633'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		try {
			const userInfo = await app.common.fetchUser(userID, { cacheIPC: false })
			const activeGuilds = await app.query(`SELECT * FROM userguilds WHERE userId = '${userID}'`)

			const userPool = {}

			for (const guild of activeGuilds) {
				const guildPlayers = await app.query(`SELECT * FROM userguilds WHERE guildId = '${guild.guildId}'`)

				for (const player of guildPlayers) {
					if (guildPlayers.length === 2) {
						if (player.userId === userID) continue
						if (!userPool[player.userId]) userPool[player.userId] = 0

						userPool[player.userId] += 1
					}
				}
			}


			const alts = new app.Embed()
				.setColor(13451564)
				.setAuthor(`${userInfo.username}#${userInfo.discriminator}`)
				.setTitle('Possible Alts')
				.setThumbnail(app.common.getAvatar(userInfo))

			for (const user in userPool) {
				alts.addField(user, `This user is alone in ${userPool[user]} ${userPool[user] > 1 ? 'servers' : 'server'} with ${userInfo.username}`)
			}

			await message.channel.createMessage(alts)
		}
		catch (err) {
			await reply(message, `Error:\`\`\`${err}\`\`\``)
		}
	}
}
