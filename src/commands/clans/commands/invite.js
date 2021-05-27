const { BUTTONS } = require('../../../resources/constants')

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

	async execute(app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const clanRow = await app.clans.getRow(scoreRow.clanId)
		const user = app.parse.members(message, args)[0]

		if (!user) {
			return message.reply('Please specify someone to invite. You can mention someone, use their Discord#tag, or type their user ID')
		}

		const invitedScoreRow = await app.player.getRow(user.id)

		if (!invitedScoreRow) {
			return message.reply('❌ The person you\'re trying to search doesn\'t have an account!')
		}
		else if (user.id === app.bot.user.id) {
			return message.reply(`${app.icons.blackjack_dealer_neutral} I don't join loser clans`)
		}
		else if (Math.floor((user.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
			return message.reply(`❌ **${user.nick || user.username}**'s Discord account must be at least 30 days old to join a clan! This helps us prevent alt abuse. 😭`)
		}
		else if (invitedScoreRow.clanId !== 0) {
			return message.reply('❌ That user is already in a clan!')
		}
		else if ((await app.clans.getMembers(scoreRow.clanId)).count >= MEMBER_LIMIT) {
			return message.reply(`❌ Your clan has the max limit of members! (${MEMBER_LIMIT}/${MEMBER_LIMIT})`)
		}

		const botMessage = await message.channel.createMessage({
			content: `<@${user.id}>, ${message.member.nick || message.member.username} invited you to join the clan: \`${clanRow.name}\`. Do you accept?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const invitedScoreRow2 = await app.player.getRow(user.id)
				const memberCount = (await app.clans.getMembers(scoreRow.clanId)).count

				if (!invitedScoreRow2) {
					return confirmed.respond({
						content: `<@${user.id}>, you don't have an account.`,
						components: []
					})
				}
				else if (invitedScoreRow2.clanId !== 0) {
					return confirmed.respond({
						content: `<@${user.id}>, you are already in a clan!`,
						components: []
					})
				}
				else if (memberCount >= MEMBER_LIMIT) {
					return confirmed.respond({
						content: `The clan has hit the max limit of members! (${MEMBER_LIMIT}/${MEMBER_LIMIT})`,
						components: []
					})
				}

				await joinClan(app, user.id, clanRow.clanId)
				await app.clans.addLog(clanRow.clanId, `${user.username} joined (inv. by ${message.author.username})`)

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

async function joinClan(app, userId, clanId) {
	await app.query(`UPDATE scores SET clanId = ${clanId} WHERE userId = ${userId}`)
	await app.query(`UPDATE scores SET clanRank = 0 WHERE userId = ${userId}`)
}
