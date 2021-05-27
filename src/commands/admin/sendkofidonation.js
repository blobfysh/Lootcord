exports.command = {
	name: 'sendkofidonation',
	aliases: [],
	description: 'Gives user Ko-fi donation rewards.',
	long: 'Gives user Ko-fi donation rewards.',
	args: {
		'User ID': 'ID of user to give rewards.',
		'coffees': 'Number of coffees to send.'
	},
	examples: ['sendkofidonation 168958344361541633 2'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userID = args[0]
		const coffees = args[1]

		if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}
		else if (!coffees) {
			return message.reply('❌ You forgot to include the number of coffees.')
		}

		const donateObj = {
			message: userID,
			amount: coffees * 3
		}

		app.ipc.sendTo(0, 'donation', { data: JSON.stringify(donateObj) })

		message.reply('✅ Sent donation request.')
	}
}
