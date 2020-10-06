module.exports = {
	name: 'leave',
	aliases: [''],
	description: 'Leave your current clan.',
	long: 'Leave your current clan.',
	args: {},
	examples: [],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 0,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const clanRow = await app.clans.getRow(scoreRow.clanId)

		let leaveMsg = `Leave clan: \`${clanRow.name}\`?`

		if (app.clan_ranks[scoreRow.clanRank].title === 'Leader') {
			leaveMsg = `Leaving a clan you are the leader of will disband the clan. Are you sure you want to disband \`${clanRow.name}\`?`
		}

		const botMessage = await message.channel.createMessage(leaveMsg)

		try {
			const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

			if (confirmed) {
				const scoreRow2 = await app.player.getRow(message.author.id)

				if (scoreRow2.clanId === 0 || scoreRow2.clanId !== scoreRow.clanId) {
					return message.reply('❌ You are not a member of any clan.')
				}

				leaveClan(app, message.author.id)
				if (app.clan_ranks[scoreRow.clanRank].title === 'Leader') {
					app.clans.disbandClan(scoreRow.clanId)
				}

				app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} left`)

				botMessage.edit(`✅ Successfully left clan: \`${clanRow.name}\``)
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit('You didn\'t react in time.')
		}
	}
}

async function leaveClan(app, userId) {
	await app.query(`UPDATE scores SET clanId = 0 WHERE userId = ${userId}`)
	await app.query(`UPDATE scores SET clanRank = 0 WHERE userId = ${userId}`)
}
