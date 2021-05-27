const shortid = require('shortid')
const { BUTTONS } = require('../../resources/constants')

exports.command = {
	name: 'invwipe',
	aliases: [],
	description: 'Wipes a users inventory.',
	long: 'Wipes a users inventory (specifically all items and money). Will generate a wipe ID that can be used to restore the player\'s inventory.\nNotifies user',
	args: {
		'User ID': 'ID of user to wipe.',
		'reason': 'Reason for wiping.'
	},
	examples: ['invwipe 168958344361541633 cheating'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,


	async execute(app, message, { args, prefix, guildInfo }) {
		const userID = args[0]
		let banReason = args.slice(1).join(' ')

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}

		const row = await app.player.getRow(userID)
		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		if (!row) {
			return message.reply('❌ User has no account.')
		}
		if (!banReason || banReason === '') {
			banReason = 'No reason provided.'
		}

		const botMessage = await message.reply({
			content: `Wipe **${user.username}#${user.discriminator}**?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const wipeId = shortid.generate()

				await app.query('INSERT INTO wiped_data (wipeId, userId, item) SELECT ?, userId, item FROM user_items WHERE userId = ?', [wipeId, userID])

				await app.query('DELETE FROM user_items WHERE userId = ?', [userID])
				await app.query('UPDATE scores SET money = 100 WHERE userId = ?', [userID])

				const invWipeMsg = new app.Embed()
					.setTitle('Inventory Wiped')
					.setDescription(`Your inventory was wiped for breaking rules. Future offenses will result in a ban.\`\`\`\n${banReason}\`\`\``)
					.setColor(16734296)
					.setFooter('https://lootcord.com/rules | Only moderators can send you messages.')

				const logMsg = new app.Embed()
					.setTitle('Inventory Wiped')
					.setThumbnail(app.common.getAvatar(user))
					.addField('Moderator', `\`\`\`\n${message.author.username}#${message.author.discriminator}\`\`\``)
					.addField('User', `\`\`\`\n${user.username}#${user.discriminator}\nID: ${userID}\`\`\``)
					.addField('Wipe ID', `\`\`\`\n${wipeId}\`\`\``)
					.addField('Money Wiped', app.common.formatNumber(row.money))
					.setColor(11346517)
					.setTimestamp()

				try {
					app.messager.messageLogs(logMsg)
					await app.common.messageUser(userID, invWipeMsg, { throwErr: true })

					await confirmed.respond({
						content: `Successfully wiped **${user.username}#${user.discriminator}**'s items and money. (Wipe ID: \`${wipeId}\`)`,
						components: []
					})
				}
				catch (err) {
					await confirmed.respond({
						content: `Unable to send message to user, their inventory was still wiped however. \`\`\`js\n${err}\`\`\``,
						components: []
					})
				}
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
