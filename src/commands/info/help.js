const tips = require('../../resources/json/tips')

module.exports = {
	name: 'help',
	aliases: ['commands', 'cmds'],
	description: 'helpception',
	long: 'helpception',
	args: {
		command: 'Command to lookup info for.'
	},
	examples: ['help inv'],
	ignoreHelp: true,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		if (args[0]) {
			const cmd = app.commands.get(args[0]) || app.commands.find(c => c.aliases && c.aliases.includes(args[0]))

			if (!cmd) return message.reply('❌ That command doesn\'t exist!')

			// disable command lookup of admin/moderator commands
			if (cmd.category === 'admin' && !app.sets.adminUsers.has(message.author.id)) return message.reply('❌ That command doesn\'t exist!')

			if (cmd.category === 'moderation' && !(await app.cd.getCD(message.author.id, 'mod') || app.sets.adminUsers.has(message.author.id))) return message.reply('❌ That command doesn\'t exist!')

			const embed = new app.Embed()
				.setTitle(`🔎 ${cmd.name}`)
				.setDescription(cmd.long)

			if (cmd.examples.length && cmd.examples[0].length) embed.addField('Examples', cmd.examples.map(ex => `\`${prefix}${ex}\``).join(', '))
			if (cmd.aliases.length && cmd.aliases[0].length) embed.addField('Aliases', cmd.aliases.map(alias => `\`${alias}\``).join(', '))
			embed.addField('Usage', `\`${getUsage(prefix, cmd)}\``)
			if (Object.keys(cmd.args).length) embed.addField('Options', getOptions(cmd))
			embed.setColor(13451564)

			return message.channel.createMessage(embed)
		}

		const categories = {}

		app.commands.forEach(cmd => {
			if (cmd.ignoreHelp) return

			if (categories[cmd.category]) {
				categories[cmd.category].push(cmd.premiumCmd ? `✨${cmd.name}` : cmd.name)
			}
			else {
				categories[cmd.category] = [cmd.premiumCmd ? `✨${cmd.name}` : cmd.name]
			}
		})

		const date = new Date()
		const converted = new Date(date.toLocaleString('en-US', {
			timeZone: 'America/New_York'
		}))
		const todaysMonth = converted.getMonth()
		let description = `${'🎃 **It\'s Halloween! Use the `trickortreat` command to collect candy, fight monsters with `enablespawns` and look out for new events!**' +
        '\n**[Help keep the bot running and get rewards!](https://www.patreon.com/lootcord)**\nFor details on using clan commands, you can type `'}${
			prefix}clan help\`, or check this [link](https://lootcord.com/guides/clans).` +
        `\n\n__**Tip:**__\n${tips[Math.floor(Math.random() * tips.length)]}`

		converted.setDate(converted.getDate() + 10)

		const embed = new app.Embed()
			.setAuthor('Lootcord Commands', message.author.avatarURL)
			.setFooter(`To see more about a command, use ${prefix}help <command>`)
			.setColor(13451564)

		if (todaysMonth !== converted.getMonth()) {
			const daysUntilWipe = 10 - converted.getDate()

			if (daysUntilWipe <= 0) {
				description = `⚠️ **WIPE HYPE** Levels will be wiped **tomorrow**! This will clear your crafting recipes.\n\n${description}`
			}
			else {
				description = `⚠️ **WIPE HYPE** The monthly level wipe will happen in **${daysUntilWipe}** days! This will clear your crafting recipes.\n\n${description}`
			}
		}

		embed.setDescription(description)

		const categoriesArr = Object.keys(categories)

		if (categoriesArr.includes('items')) embed.addField('⚔ Item Usage', categories.items.map(cmd => `\`${cmd}\``).join(' '))
		if (categoriesArr.includes('rewards')) embed.addField('🎉 Free Loot', categories.rewards.map(cmd => `\`${cmd}\``).join(' '))
		if (categoriesArr.includes('games')) embed.addField('🎲 Gambling', categories.games.map(cmd => `\`${cmd}\``).join(' '))
		if (categoriesArr.includes('info')) embed.addField('📋 Info', categories.info.map(cmd => `\`${cmd}\``).join(' '))
		if (categoriesArr.includes('blackmarket')) embed.addField('💰 Black Market', categories.blackmarket.map(cmd => `\`${cmd}\``).join(' '))
		if (categoriesArr.includes('utilities')) embed.addField('⚙ Utility', categories.utilities.map(cmd => `\`${cmd}\``).join(' '))
		if (categoriesArr.includes('other')) embed.addField('📈 Other', categories.other.map(cmd => `\`${cmd}\``).join(' '))

		embed.addField('⚔️ Clans', Array.from(app.clanCommands.keys()).map(cmd => `\`${cmd}\``).join(' '))

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
