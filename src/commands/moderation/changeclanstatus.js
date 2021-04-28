exports.command = {
	name: 'changeclanstatus',
	aliases: [],
	description: 'Change status for a clan.',
	long: 'Change status for a clan. Should be used if you see a status that goes against Discord TOS.',
	args: {
		'Clan ID': 'ID of clan to edit status of.'
	},
	examples: ['changeclanstatus 12 pls'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const clanID = args[0]
		const statusToSet = message.cleanContent.slice(prefix.length).split(/ +/).slice(2).join(' ')

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!clanID) {
			return message.reply('❌ You forgot to include a clan ID.')
		}

		try {
			await app.query('UPDATE clans SET status = ? WHERE clanId = ?', [statusToSet, clanID])

			message.reply(`✅ Successfully changed status of clan with ID \`${clanID}\` to: ${statusToSet}`)
		}
		catch (err) {
			message.reply(`Error:\`\`\`\n${err}\`\`\``)
		}
	}
}
