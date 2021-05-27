const { BUTTONS } = require('../../../resources/constants')

exports.command = {
	name: 'promote',
	aliases: [],
	description: 'Promote a user in your clan.',
	long: 'Promote a user in your clan. You can promote using a mention, Discord#tag or by using their number from the clan member list.',
	args: { '@user/discord#tag': 'User to promote.' },
	examples: ['clan promote @blobfysh'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 3,

	async execute (app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		let member = app.parse.members(message, args)[0]
		const number = app.parse.numbers(args)[0]
		let promoteMessage = ''

		if (!member && number) {
			const members = await app.clans.getMembers(scoreRow.clanId)
			const memberId = members.memberIds[number - 1]

			if (!memberId) {
				return message.reply(`Please specify someone to promote. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
			}

			member = await app.common.fetchUser(memberId, { cacheIPC: false })
		}
		else if (!member) {
			return message.reply(`Please specify someone to promote. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
		}

		const invitedScoreRow = await app.player.getRow(member.id)

		if (!invitedScoreRow) {
			return message.reply('❌ The person you\'re trying to search doesn\'t have an account!')
		}
		else if (invitedScoreRow.clanId !== scoreRow.clanId) {
			return message.reply('❌ That user is not in your clan.')
		}
		else if (message.author.id === member.id) {
			return message.reply('❌ You cannot promote yourself.')
		}
		else if (app.clan_ranks[invitedScoreRow.clanRank + 1].title !== 'Leader' && (invitedScoreRow.clanRank + 1) >= scoreRow.clanRank) {
			return message.reply('You cannot promote members to an equal or higher rank!')
		}
		else if (app.clan_ranks[invitedScoreRow.clanRank + 1].title === 'Leader') {
			promoteMessage = `Promoting this member will make them the leader of the clan! Are you sure you want to give leadership to **${member.username}#${member.discriminator}**?`
		}
		else {
			promoteMessage = `Promote **${member.username}#${member.discriminator}** to \`${app.clan_ranks[invitedScoreRow.clanRank + 1].title}\`? This rank grants the following permissions:\n\`\`\`${app.clan_ranks[invitedScoreRow.clanRank + 1].perms.join('\n')}\`\`\`\n**Promoting a member you don't trust is dangerous!**`
		}

		const botMessage = await message.channel.createMessage({
			content: promoteMessage,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const invitedScoreRow2 = await app.player.getRow(member.id)

				if (invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank) {
					return confirmed.respond({
						content: '❌ Error promoting user, try again?',
						components: []
					})
				}
				else if (app.clan_ranks[invitedScoreRow2.clanRank + 1].title === 'Leader') {
					await transferLeadership(app, message.author.id, member.id, scoreRow.clanId)
				}
				else {
					await app.query(`UPDATE scores SET clanRank = ${invitedScoreRow2.clanRank + 1} WHERE userId = ${member.id}`)
				}

				await confirmed.respond({
					content: `✅ Successfully promoted **${member.username}#${member.discriminator}** to rank \`${app.clan_ranks[invitedScoreRow2.clanRank + 1].title}\``,
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

async function transferLeadership (app, oldLeaderId, leaderId, clanId) {
	const newLeaderRow = (await app.query(`SELECT * FROM scores WHERE userId = ${leaderId}`))[0]
	const oldLeaderRow = (await app.query(`SELECT * FROM scores WHERE userId = ${oldLeaderId}`))[0]
	await app.query(`UPDATE scores SET clanRank = ${newLeaderRow.clanRank + 1} WHERE userId = ${leaderId}`)
	await app.query(`UPDATE scores SET clanRank = ${oldLeaderRow.clanRank - 1} WHERE userId = ${oldLeaderId}`)

	await app.query(`UPDATE clans SET ownerId = ${leaderId} WHERE clanId = ${clanId}`)
}
