const Filter = require('bad-words')
const emojiRegex = require('emoji-regex/RGI_Emoji')
const regex = new RegExp(`^(${emojiRegex().source}|${/[\w!$%^&*()\-+=~`'";<>,.?|\\{}[\]: ]/.source})*$`)
const filter = new Filter({ placeHolder: 'x' })

exports.command = {
	name: 'setstatus',
	aliases: [],
	description: 'Sets the users status to display in commands.',
	long: 'Changes your status in the profile command. Supports Discord unicode emoji.',
	args: { status: 'Status to set in the profile command.' },
	examples: ['setstatus I am very cool'],
	permissions: ['sendMessages', 'embedLinks'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		let statusToSet = message.cleanContent.slice(prefix.length).split(/ +/).slice(1).join(' ')

		if (statusToSet.length > 120) {
			return message.reply(`Your status can only be up to 120 characters long! You tried to set one that was ${statusToSet.length} characters long.`)
		}
		else if (!regex.test(statusToSet)) {
			return message.reply('❌ New lines and some special characters (@, #) are not supported in statuses. 😺 Emojis are supported!')
		}

		// TODO update bad-words once this gets fixed
		// adding a random letter and removing as work around for badwords issue when string only contains emoji:
		// https://github.com/web-mech/badwords/issues/93
		statusToSet = filter.clean(`a ${statusToSet}`)
		statusToSet = statusToSet.slice(2)

		try {
			if (serverSideGuildId) {
				await app.query('UPDATE server_scores SET status = ? WHERE userId = ? AND guildId = ?', [!statusToSet ? '' : statusToSet, message.author.id, serverSideGuildId])
			}
			else {
				await app.query('UPDATE scores SET status = ? WHERE userId = ?', [!statusToSet ? '' : statusToSet, message.author.id])
			}

			message.reply(`✅ Successfully set status to: ${!statusToSet ? 'Nothing?' : statusToSet}`)

			const logEmbed = new app.Embed()
				.setTitle('Modified Status')
				.setThumbnail(message.author.avatarURL)
				.setDescription(`${`${message.author.username}#${message.author.discriminator}`} ID: \`\`\`\n${message.author.id}\`\`\``)
				.addField('Status Changed', !statusToSet ? 'Nothing?' : statusToSet)
				.addField('Server-side Economy?', serverSideGuildId ? `Yes, server ID: ${serverSideGuildId}` : 'No (global)')
				.setColor('#8C8C8C')
				.setFooter('Make sure status does not violate TOS or is vulgar')
			app.messager.messageLogs(logEmbed)
		}
		catch (err) {
			message.reply('❌ There was an error trying to modify your status.')
		}
	}
}
