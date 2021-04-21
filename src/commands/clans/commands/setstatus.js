const Filter = require('bad-words')
const emojiRegex = require('emoji-regex/RGI_Emoji')
const regex = new RegExp(`^(${emojiRegex().source}|${/[\w!$%^&*()\-+=~`'";<>,.?|\\{}[\]: ]/.source})*$`)
const filter = new Filter({ placeHolder: 'x' })

module.exports = {
	name: 'setstatus',
	aliases: ['status'],
	description: 'Changes the clan status.',
	long: 'Changes the clan status.',
	args: { status: 'Status to set.' },
	examples: ['clan setstatus Better than u'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 2,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)

		let statusToSet = message.cleanContent.slice(prefix.length).split(/ +/).slice(2).join(' ')

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
			await app.query('UPDATE clans SET status = ? WHERE clanId = ?', [!statusToSet ? '' : statusToSet, scoreRow.clanId])

			app.clans.addLog(scoreRow.clanId, `${message.author.username} set the clan status to: ${!statusToSet ? 'Nothing?' : statusToSet}`)
			message.reply(`✅ Successfully set status to: ${!statusToSet ? 'Nothing?' : statusToSet}`)

			const logEmbed = new app.Embed()
				.setTitle('Modified Clan Status')
				.setThumbnail(message.author.avatarURL)
				.setDescription(`${`${message.author.username}#${message.author.discriminator}`} ID: \`\`\`\n${message.author.id}\`\`\`Clan ID:\`\`\`\n${scoreRow.clanId}\`\`\``)
				.addField('Status Changed', !statusToSet ? 'Nothing?' : statusToSet)
				.setColor('#8E588E')
				.setFooter('Make sure status does not violate TOS or is vulgar')
			app.messager.messageLogs(logEmbed)
		}
		catch (err) {
			message.reply('❌ There was an error trying to modify your status.')
		}
	}
}
