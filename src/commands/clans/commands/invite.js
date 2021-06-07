const { BUTTONS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')

const MEMBER_LIMIT = 20

exports.command = {
	name: 'invite',
	aliases: [],
	description: 'Invite a user to join your clan.',
	long: 'Invite a user to join your clan.',
	args: { '@user/discord#tag': 'User to invite.' },
	examples: ['clan invite @blobfysh'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 2,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const clanRow = await app.clans.getRow(scoreRow.clanId, serverSideGuildId)
		const user = app.parse.members(message, args)[0]

		if (!user) {
			return reply(message, 'Please specify someone to invite. You can mention someone, use their Discord#tag, or type their user ID')
		}

		const invitedScoreRow = await app.player.getRow(user.id, serverSideGuildId)

		if (!invitedScoreRow) {
			return reply(message, '❌ The person you\'re trying to search doesn\'t have an account!')
		}
		else if (user.id === app.bot.user.id) {
			return reply(message, `${app.icons.blackjack_dealer_neutral} I don't join loser clans`)
		}
		else if (Math.floor((user.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
			return reply(message, `❌ **${user.nick || user.username}**'s Discord account must be at least 30 days old to join a clan! This helps us prevent alt abuse. 😭`)
		}
		else if (invitedScoreRow.clanId !== 0) {
			return reply(message, '❌ That user is already in a clan!')
		}
		else if ((await app.clans.getMembers(scoreRow.clanId, serverSideGuildId)).count >= MEMBER_LIMIT) {
			return reply(message, `❌ Your clan has the max limit of members! (${MEMBER_LIMIT}/${MEMBER_LIMIT})`)
		}

		const botMessage = await message.channel.createMessage({
			content: `<@${user.id}>, ${message.member.nick || message.member.username} invited you to join the clan: \`${clanRow.name}\`. Do you accept?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === user.id))[0]

			if (confirmed.customID === 'confirmed') {
				const transaction = await app.mysql.beginTransaction()
				const invitedScoreRow2 = await app.player.getRowForUpdate(transaction.query, user.id, serverSideGuildId)
				const memberCount = (await app.clans.getMembers(scoreRow.clanId, serverSideGuildId)).count

				if (!invitedScoreRow2) {
					await transaction.commit()

					return confirmed.respond({
						content: `<@${user.id}>, you don't have an account.`,
						components: []
					})
				}
				else if (invitedScoreRow2.clanId !== 0) {
					await transaction.commit()

					return confirmed.respond({
						content: `<@${user.id}>, you are already in a clan!`,
						components: []
					})
				}
				else if (memberCount >= MEMBER_LIMIT) {
					await transaction.commit()

					return confirmed.respond({
						content: `The clan has hit the max limit of members! (${MEMBER_LIMIT}/${MEMBER_LIMIT})`,
						components: []
					})
				}

				if (serverSideGuildId) {
					await transaction.query('UPDATE server_scores SET clanId = ?, clanRank = 0 WHERE userId = ? AND guildId = ?', [clanRow.clanId, user.id, message.channel.guild.id])
				}
				else {
					await transaction.query('UPDATE scores SET clanId = ?, clanRank = 0 WHERE userId = ?', [clanRow.clanId, user.id])
				}

				await transaction.commit()
				await app.clans.addLog(clanRow.clanId, `${user.username} joined (inv. by ${message.author.username})`, serverSideGuildId)

				await confirmed.respond({
					content: `<@${user.id}>, You are now a member of \`${clanRow.name}\`\n\nView your clan information with \`${prefix}clan info\` and check the inventory with \`${prefix}clan inv\`.`,
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
