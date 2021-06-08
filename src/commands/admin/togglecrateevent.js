const { reply } = require('../../utils/messageUtils')
const { init } = require('../../utils/codeChallenge')

exports.command = {
	name: 'togglecrateevent',
	aliases: [],
	description: 'Toggles whether the current channel will have locked crate events.',
	long: 'Toggles whether the current channel will have locked crate events.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const eventChannel = (await app.query('SELECT * FROM locked_crate_channels WHERE channelId = ?', [message.channel.id]))[0]

		if (eventChannel) {
			await app.query('DELETE FROM locked_crate_channels WHERE channelId = ?', [message.channel.id])

			await reply(message, 'Removed this channel from the locked_crate spawns list. *This will take effect next restart*')
		}
		else {
			await app.query('INSERT INTO locked_crate_channels (channelId) VALUES (?)', [message.channel.id])

			init(app, message.channel)

			await reply(message, 'Successfully set this channel as a locked crate spawn channel.')
		}
	}
}
