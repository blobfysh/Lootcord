const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'disablecommand',
	aliases: [],
	description: 'Disables a command.',
	long: 'Disables a command across all shards. Use this if a command is broken and needs fixing.\n\n**Will re-enable a command if it\'s already disabled.**',
	args: {
		command: 'The full name of the command to disable (NOT ALIAS).'
	},
	examples: ['disablecommand inventory'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const command = args[0]

		if (!command) {
			return reply(message, '❌ You forgot to include a command.')
		}

		if (app.sets.disabledCommands.has(command)) {
			app.ipc.broadcast('enableCmd', {
				cmd: command
			})

			await reply(message, `✅ Successfully enabled \`${command}\`.`)
		}
		else {
			app.ipc.broadcast('disableCmd', {
				cmd: command
			})

			await reply(message, `❌ Successfully disabled \`${command}\`.`)
		}
	}
}
