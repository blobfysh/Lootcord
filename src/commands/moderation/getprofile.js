const { makeProfile } = require('../info/profile')

exports.command = {
	name: 'getprofile',
	aliases: ['getp'],
	description: 'Fetches a users profile.',
	long: 'Fetches a users profile using their ID.',
	args: {
		'User ID': 'ID of user to check.'
	},
	examples: ['getprofile 168958344361541633'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]

		if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}

		const userInfo = await app.common.fetchUser(userID, { cacheIPC: false })
		const profile = await makeProfile(app, userInfo, undefined)

		message.reply(profile)
	}
}
