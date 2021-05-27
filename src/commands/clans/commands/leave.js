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

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const clanRow = await app.clans.getRow(scoreRow.clanId)

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
				const scoreRow2 = await app.player.getRow(message.author.id)

				if (scoreRow2.clanId === 0 || scoreRow2.clanId !== scoreRow.clanId) {
					return confirmed.respond({
						content: '❌ You are not a member of any clan.',
						components: []
					})
				}

				leaveClan(app, message.author.id)
				if (app.clan_ranks[scoreRow.clanRank].title === 'Leader') {
					app.clans.disbandClan(scoreRow.clanId)
				}

				await app.clans.addLog(scoreRow.clanId, `${`${message.author.username}#${message.author.discriminator}`} left`)

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
			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}

async function leaveClan (app, userId) {
	await app.query(`UPDATE scores SET clanId = 0 WHERE userId = ${userId}`)
	await app.query(`UPDATE scores SET clanRank = 0 WHERE userId = ${userId}`)
}
