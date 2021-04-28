exports.command = {
	name: 'modhelp',
	aliases: [],
	description: 'Shows moderation commands.',
	long: 'Shows moderation commands.',
	args: {
		command: 'Command to lookup info for.'
	},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		if (args[0]) {
			const command = args[0].toLowerCase()
			const cmd = app.commands.find(c => c.name === command && c.category === 'moderation') || app.commands.find(c => c.aliases && c.aliases.includes(command) && c.category === 'moderation')

			if (!cmd) return message.reply('❌ I don\'t recognize that moderator command.')

			const embed = new app.Embed()
				.setTitle(`🔎 ${cmd.name}`)
				.setDescription(cmd.long)

			if (cmd.examples.length && cmd.examples[0].length) embed.addField('Examples', cmd.examples.map(ex => `\`${prefix}${ex}\``).join(', '))
			if (cmd.aliases.length && cmd.aliases[0].length) embed.addField('Aliases', cmd.aliases.map(alias => `\`${alias}\``).join(', '))
			embed.addField('Usage', `\`${getUsage(prefix, cmd)}\``)
			if (Object.keys(cmd.args).length) embed.addField('Options', getOptions(cmd))
			embed.setColor('#ff7272')

			return message.channel.createMessage(embed)
		}

		const commands = app.commands.filter(cmd => cmd.category === 'moderation')

		const embed = new app.Embed()
			.setAuthor('Moderation Commands', message.author.avatarURL)
			.setDescription(`Most commands require you are in the moderator channel. \`getstats\`, \`getprofile\`, \`getinv\`, and \`shardinfo\` work anywhere.\n\n${commands.map(cmd => `\`${cmd.name}\``).join(' ')}`)
			.setFooter(`To see more about a command, use ${prefix}modhelp <command>`)
			.setColor('#ff7272')

		message.channel.createMessage(embed)
	}
}

function getUsage(prefix, cmd) {
	let finalStr = `${prefix}${cmd.name}`

	for (const arg of Object.keys(cmd.args)) {
		finalStr += ` <${arg}>`
	}

	return finalStr
}

function getOptions(cmd) {
	let finalStr = ''

	for (const arg of Object.keys(cmd.args)) {
		finalStr += `\`${arg}\` - ${cmd.args[arg]}\n`
	}

	return finalStr
}
