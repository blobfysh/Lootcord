const { BUTTONS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

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

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		let member = app.parse.members(message, args)[0]
		const number = app.parse.numbers(args)[0]
		let promoteMessage = ''

		if (!member && number) {
			const members = await app.clans.getMembers(scoreRow.clanId, serverSideGuildId)
			const memberId = members.memberIds[number - 1]

			if (!memberId) {
				return reply(message, `Please specify someone to promote. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
			}

			member = await app.common.fetchUser(memberId, { cacheIPC: false })
		}
		else if (!member) {
			return reply(message, `Please specify someone to promote. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
		}

		const invitedScoreRow = await app.player.getRow(member.id, serverSideGuildId)

		if (!invitedScoreRow) {
			return reply(message, '❌ The person you\'re trying to search doesn\'t have an account!')
		}
		else if (invitedScoreRow.clanId !== scoreRow.clanId) {
			return reply(message, '❌ That user is not in your clan.')
		}
		else if (message.author.id === member.id) {
			return reply(message, '❌ You cannot promote yourself.')
		}
		else if (app.clan_ranks[invitedScoreRow.clanRank + 1].title !== 'Leader' && (invitedScoreRow.clanRank + 1) >= scoreRow.clanRank) {
			return reply(message, 'You cannot promote members to an equal or higher rank!')
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
				const transaction = await app.mysql.beginTransaction()
				const invitedScoreRow2 = await app.player.getRowForUpdate(transaction.query, member.id, serverSideGuildId)
				const oldLeaderRow = await app.player.getRowForUpdate(transaction.query, message.author.id, serverSideGuildId)
				const clanRow = await app.clans.getRowForUpdate(transaction.query, oldLeaderRow.clanId, serverSideGuildId)

				if (invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank) {
					await transaction.commit()

					return confirmed.respond({
						content: '❌ Error promoting user, try again?',
						components: []
					})
				}

				if (serverSideGuildId && app.clan_ranks[invitedScoreRow2.clanRank + 1].title === 'Leader') {
					await transaction.query('UPDATE server_scores SET clanRank = clanRank + 1 WHERE userId = ? AND guildId = ?', [member.id, message.channel.guild.id])
					await transaction.query('UPDATE server_scores SET clanRank = clanRank - 1 WHERE userId = ? AND guildId = ?', [message.author.id, message.channel.guild.id])

					await transaction.query('UPDATE server_clans SET ownerId = ? WHERE clanId = ?', [member.id, clanRow.clanId])
				}
				else if (app.clan_ranks[invitedScoreRow2.clanRank + 1].title === 'Leader') {
					await transaction.query('UPDATE scores SET clanRank = clanRank + 1 WHERE userId = ?', [member.id])
					await transaction.query('UPDATE scores SET clanRank = clanRank - 1 WHERE userId = ?', [message.author.id])

					await transaction.query('UPDATE clans SET ownerId = ? WHERE clanId = ?', [member.id, clanRow.clanId])
				}
				else if (serverSideGuildId) {
					await transaction.query('UPDATE server_scores SET clanRank = clanRank + 1 WHERE userId = ? AND guildId = ?', [member.id, message.channel.guild.id])
				}
				else {
					await transaction.query('UPDATE scores SET clanRank = clanRank + 1 WHERE userId = ?', [member.id])
				}

				await transaction.commit()

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
