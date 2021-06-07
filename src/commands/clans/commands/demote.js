const { BUTTONS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

exports.command = {
	name: 'demote',
	aliases: [],
	description: 'Demote a user in your clan.',
	long: 'Demote a user in your clan. You can demote using a mention, Discord#tag or by using their number from the clan member list.',
	args: { '@user/discord#tag': 'User to demote.' },
	examples: ['clan demote @blobfysh'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 3,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		let member = app.parse.members(message, args)[0]
		const number = app.parse.numbers(args)[0]

		if (!member && number) {
			const members = await app.clans.getMembers(scoreRow.clanId, serverSideGuildId)
			const memberId = members.memberIds[number - 1]

			if (!memberId) {
				return reply(message, `Please specify someone to demote. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
			}

			member = await app.common.fetchUser(memberId, { cacheIPC: false })
		}
		else if (!member) {
			return reply(message, `Please specify someone to demote. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
		}

		const invitedScoreRow = await app.player.getRow(member.id, serverSideGuildId)

		if (!invitedScoreRow) {
			return reply(message, '❌ The person you\'re trying to search doesn\'t have an account!')
		}
		else if (invitedScoreRow.clanId !== scoreRow.clanId) {
			return reply(message, '❌ That user is not in your clan.')
		}
		else if (message.author.id === member.id) {
			return reply(message, '❌ You cannot demote yourself.')
		}
		else if (app.clan_ranks[invitedScoreRow.clanRank].title === 'Recruit') {
			return reply(message, '❌ That member is already the lowest possible rank.')
		}
		else if (invitedScoreRow.clanRank >= scoreRow.clanRank) {
			return reply(message, 'You cannot demote members of equal or higher rank!')
		}

		const botMessage = await message.channel.createMessage({
			content: `Demote **${member.username}#${member.discriminator}** to \`${app.clan_ranks[invitedScoreRow.clanRank - 1].title}\`? They will **LOSE** these permissions:\n\`\`\`${app.clan_ranks[invitedScoreRow.clanRank].perms.join('\n')}\`\`\``,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const transaction = await app.mysql.beginTransaction()
				const invitedScoreRow2 = await app.player.getRowForUpdate(transaction.query, member.id, serverSideGuildId)

				if (invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank || app.clan_ranks[invitedScoreRow2.clanRank].title === 'Recruit') {
					await transaction.commit()

					return confirmed.respond({
						content: '❌ Error demoting member, try again?',
						components: []
					})
				}

				if (serverSideGuildId) {
					await transaction.query('UPDATE server_scores SET clanRank = ? WHERE userId = ? AND guildId = ?', [invitedScoreRow2.clanRank - 1, member.id, message.channel.guild.id])
				}
				else {
					await transaction.query('UPDATE scores SET clanRank = ? WHERE userId = ?', [invitedScoreRow2.clanRank - 1, member.id])
				}

				await transaction.commit()

				await confirmed.respond({
					content: `Demoted **${member.username}#${member.discriminator}** to rank \`${app.clan_ranks[invitedScoreRow2.clanRank - 1].title}\``,
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
