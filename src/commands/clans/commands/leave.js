const { BUTTONS } = require('../../../resources/constants')

exports.command = {
	name: 'leave',
	aliases: [],
	description: 'Leave your current clan.',
	long: 'Leave your current clan.',
	args: {},
	examples: [],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 0,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const clanRow = await app.clans.getRow(scoreRow.clanId, serverSideGuildId)

		let leaveMsg = `Leave clan: \`${clanRow.name}\`?`

		if (app.clan_ranks[scoreRow.clanRank].title === 'Leader') {
			leaveMsg = `Leaving a clan you are the leader of will disband the clan. Are you sure you want to disband \`${clanRow.name}\`?`
		}

		const botMessage = await message.channel.createMessage({
			content: leaveMsg,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const transaction = await app.mysql.beginTransaction()
				const scoreRow2 = await app.player.getRowForUpdate(transaction.query, message.author.id, serverSideGuildId)

				if (scoreRow2.clanId === 0 || scoreRow2.clanId !== scoreRow.clanId) {
					await transaction.commit()

					return confirmed.respond({
						content: '❌ You are not a member of any clan.',
						components: []
					})
				}

				if (serverSideGuildId) {
					await transaction.query('UPDATE server_scores SET clanId = 0, clanRank = 0 WHERE userId = ? AND guildId = ?', [message.author.id, message.channel.guild.id])
				}
				else {
					await transaction.query('UPDATE scores SET clanId = 0, clanRank = 0 WHERE userId = ?', [message.author.id])
				}

				if (app.clan_ranks[scoreRow.clanRank].title === 'Leader') {
					await transaction.query(`UPDATE ${serverSideGuildId ? 'server_scores' : 'scores'} SET clanId = 0, clanRank = 0 WHERE clanId = ?`, [scoreRow2.clanId])

					await transaction.query(`DELETE FROM ${serverSideGuildId ? 'server_clan_items' : 'clan_items'} WHERE id = ?`, [scoreRow2.clanId])
					await transaction.query(`DELETE FROM ${serverSideGuildId ? 'server_clans' : 'clans'} WHERE clanId = ?`, [scoreRow2.clanId])
				}

				await transaction.commit()
				await app.clans.addLog(scoreRow2.clanId, `${`${message.author.username}#${message.author.discriminator}`} left`, serverSideGuildId)

				await confirmed.respond({
					content: `✅ Successfully left clan: \`${clanRow.name}\``,
					components: []
				})
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			console.log(err)

			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
