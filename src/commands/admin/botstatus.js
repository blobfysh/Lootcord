const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'botstatus',
	aliases: [],
	description: 'Changes the bot\'s status.',
	long: 'Changes status on all shards. Content is auto-formatted after the t-help |\n\nTypes:\n0 - playing\n1 - streaming\n2 - listening\n3 - watching\n\n**If you set the type to 2 (listening), the bot won\'t auto-update the status.** Once you are done broadcasting a status, you can allow the bot to auto-update by changing the type to online/etc.',
	args: {
		status: 'online/dnd/idle/invisible',
		type: '0/1/2/3',
		content: 'Content of status.'
	},
	examples: ['botstatus online 0 Hello!'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const status = args[0]
		const type = args[1]
		const content = args.slice(2).join(' ')

		if (!status) {
			return reply(message, '❌ You forgot to include a status.')
		}
		else if (!type) {
			return reply(message, '❌ You forgot to include the type of status.')
		}
		else if (!content) {
			return reply(message, '❌ You forgot to include the content of the status.')
		}

		app.ipc.broadcast('setStatus', {
			status,
			type,
			content
		})

		await reply(message, '✅ Set status across all shards.')
	}
}
