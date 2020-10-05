module.exports = {
	name: 'disablecommand',
	aliases: [''],
	description: 'Disables a command.',
	long: 'Disables a command across all shards. Use this if a command is broken and needs fixing.\n\n**Will re-enable a command if it\'s already disabled.**',
	args: {
		command: 'The full name of the command to disable (NOT ALIAS).'
	},
	examples: ['disablecommand inventory'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message) {
		const command = message.args[0]

		if (!command) {
			return message.reply('❌ You forgot to include a command.')
		}

		if (app.sets.disabledCommands.has(command)) {
			app.ipc.broadcast('enableCmd', {
				cmd: command
			})

			message.reply(`✅ Successfully enabled \`${command}\`.`)
		}
		else {
			app.ipc.broadcast('disableCmd', {
				cmd: command
			})

			message.reply(`❌ Successfully disabled \`${command}\`.`)
		}
	}
}
