const Filter = require('bad-words')
const filter = new Filter()

module.exports = {
	name: 'setstatus',
	aliases: [''],
	description: 'Sets the users status to display in commands.',
	long: 'Changes your status in the profile command. Supports Discord unicode emoji.',
	args: { status: 'Status to set in the profile command.' },
	examples: ['setstatus I am very cool'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		let statusToSet = message.cleanContent.slice(prefix.length).split(/ +/).slice(1).join(' ')

		if (statusToSet.length > 120) {
			return message.reply(`Your status can only be up to 120 characters long! You tried to set one that was ${statusToSet.length} characters long.`)
		}
		else if (/['"`]/g.test(statusToSet)) {
			return message.reply('Statuses cannot contain the characters \', ", `')
		}

		statusToSet = filter.clean(statusToSet)

		try {
			await app.query('UPDATE scores SET status = ? WHERE userId = ?', [!statusToSet ? '' : statusToSet, message.author.id])

			message.reply(`✅ Successfully set status to: ${!statusToSet ? 'Nothing?' : statusToSet}`)

			const logEmbed = new app.Embed()
				.setTitle('Modified Status')
				.setThumbnail(message.author.avatarURL)
				.setDescription(`${`${message.author.username}#${message.author.discriminator}`} ID: \`\`\`\n${message.author.id}\`\`\``)
				.addField('Status Changed', !statusToSet ? 'Nothing?' : statusToSet)
				.setColor('#8C8C8C')
				.setFooter('Make sure status does not violate TOS or is vulgar')
			app.messager.messageLogs(logEmbed)
		}
		catch (err) {
			message.reply('❌ There was an error trying to modify your status.')
		}
	}
}
