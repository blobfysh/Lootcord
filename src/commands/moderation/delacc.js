module.exports = {
	name: 'delacc',
	aliases: [''],
	description: 'Deletes a user account.',
	long: 'Deletes a user account from the database. This includes items. Does NOT send a message to the user.',
	args: {
		'User ID': 'ID of user to delete.'
	},
	examples: ['delacc 168958344361541633'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const userID = args[0]

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}
		else if (await app.cd.getCD(userID, 'mod')) {
			return message.reply('Hey stop trying to delete a moderator!!! >:(')
		}

		const userRow = await app.player.getRow(userID)

		if (!userRow) {
			return message.reply('❌ User has no account.')
		}

		const warnings = await app.query(`SELECT * FROM warnings WHERE userId = '${userID}'`)
		const user = await app.common.fetchUser(userID, { cacheIPC: false })

		const botMessage = await message.reply(`**${user.username}#${user.discriminator}** currently has **${warnings.length}** warnings on record. Continue delete?`)

		try {
			const userRow2 = await app.player.getRow(userID)
			const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

			if (confirmed) {
				if (!userRow2) {
					return message.reply('❌ User has no account.')
				}
				else if (app.clan_ranks[userRow2.clanRank].title === 'Leader') {
					app.clans.disbandClan(userRow2.clanId)
				}

				// remove bounties before deleting scores row because of foreign constraints
				await app.bountyHandler.removeBounties(userID)
				await app.query(`DELETE FROM scores WHERE userId ="${userID}"`)
				await app.query(`DELETE FROM user_items WHERE userId ="${userID}"`)
				await app.query(`DELETE FROM badges WHERE userId = ${userID}`)
				await app.query(`DELETE FROM userGuilds WHERE userId = ${userID}`)
				await app.query(`DELETE FROM blackmarket WHERE sellerId ="${userID}"`)
				await app.cd.clearCD(userID, 'shield')

				botMessage.edit(`Successfully deleted **${user.username}#${user.discriminator}**'s account data.`)

				const deleteEmbed = new app.Embed()
					.setTitle('⛔ Account Deleted by Moderators')
					.setDescription(`**${`${message.author.username}#${message.author.discriminator}`}** deleted **${user.username}#${user.discriminator}**'s account.\`\`\`fix\nID: ${userID}\`\`\``)
					.setColor(16636672)

				try {
					app.messager.messageLogs(deleteEmbed)
				}
				catch (err) {
					console.warn(err)
				}
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit('❌ Timed out.')
		}
	}
}
