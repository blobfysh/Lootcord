exports.command = {
	name: 'clan',
	aliases: ['clans'],
	description: 'The base command for everything to do with clans!',
	long: 'The base command for all clan commands. For a detailed look at all the clan commands and how clans work check out: https://lootcord.com/guides/clans.',
	args: {},
	examples: ['clan info mod squad'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	globalEconomyOnly: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)

		const commandName = args[0] ? args[0].toLowerCase() : undefined
		const command = app.clanCommands.find(cmd => cmd.name === commandName || (cmd.aliases.length && cmd.aliases.includes(commandName)))

		if (!command) {
			try {
				// show help command if user has no clan and wasn't trying to search for any
				if (scoreRow.clanId === 0 && !args.length) {
					return app.clanCommands.find(cmd => cmd.name === 'help').execute(app, message, { args, prefix, guildInfo })
				}

				return app.clanCommands.find(cmd => cmd.name === 'info').execute(app, message, { args, prefix, guildInfo })
			}
			catch (err) {
				console.log(err)
			}
		}
		else if (scoreRow.clanId === 0 && command.requiresClan) {
			return message.reply('❌ That command requires that you are a member of a clan.')
		}
		else if (command.requiresActive && !await app.player.isActive(message.author.id, message.channel.guild.id)) {
			return message.channel.createMessage(`❌ You need to activate before using that clan command here! Use \`${prefix}activate\` to activate.`)
		}
		else if (scoreRow.clanRank < command.minimumRank) {
			return message.reply(`❌ Your clan rank is not high enough to use this command! Your rank: \`${app.clan_ranks[scoreRow.clanRank].title}\` Required: \`${app.clan_ranks[command.minimumRank].title}\`+`)
		}
		else if (command.levelReq && scoreRow.level < command.levelReq) {
			return message.reply(`❌ You must be at least level \`${command.levelReq}\` to use this command!`)
		}

		try {
			command.execute(app, message, { args: args.slice(1), prefix })
		}
		catch (err) {
			console.log(err)
		}
	}
}
