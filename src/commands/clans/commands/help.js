exports.command = {
	name: 'help',
	aliases: [],
	description: 'Show all clan commands.',
	long: 'Shows all clan commands.',
	args: { command: 'Command to lookup info for.' },
	examples: [],
	requiresClan: false,
	requiresActive: false,
	minimumRank: 0,

	async execute(app, message, { args, prefix, guildInfo }) {
		if (args[0]) {
			const cmd = app.clanCommands.find(c => c.name === args[0] || (c.aliases.length && c.aliases.includes(args[0])))

			if (!cmd) return message.reply('❌ That isn\'t a clan command, use `clan help` to see available clan commands.')

			const embed = new app.Embed()
				.setTitle(`🔎 clan ${cmd.name}`)
				.setDescription(cmd.long)
			if (cmd.requiresClan) embed.addField('Required Rank', getRank(app, cmd))
			if (cmd.examples.length && cmd.examples[0].length) embed.addField('Examples', cmd.examples.map(ex => `\`${prefix}${ex}\``).join(', '))
			if (cmd.aliases.length && cmd.aliases[0].length) embed.addField('Aliases', cmd.aliases.map(alias => `\`${alias}\``).join(', '))
			embed.addField('Usage', `\`${getUsage(prefix, cmd)}\``)
			if (Object.keys(cmd.args).length) embed.addField('Options', getOptions(cmd))
			embed.setColor(13451564)

			return message.channel.createMessage(embed)
		}

		const helpEmbed = new app.Embed()
			.setTitle('Clan Help')
			.setColor(13451564)
			.setDescription(`Check out this [guide](https://lootcord.com/guides/clans) on how to use clans.\nTo use a clan command: \`${prefix}clan <command>\`` +
				`\n\n${app.clanCommands.map(cmd => `\`${prefix}clan ${cmd.name}\` - ${cmd.description}${cmd.levelReq ? ` (Lvl Required: ${cmd.levelReq}+)` : ''}`).join('\n')}`)
			.setFooter(`To see more about a clan command, use ${prefix}clan help <command>`)

		message.channel.createMessage(helpEmbed)
	}
}

function getRank(app, cmd) {
	return `\`${app.clan_ranks[cmd.minimumRank].title}\`+`
}

function getUsage(prefix, cmd) {
	let finalStr = `${prefix}clan ${cmd.name}`

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
