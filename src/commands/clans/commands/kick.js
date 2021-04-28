exports.command = {
	name: 'kick',
	aliases: [],
	description: 'Kick a user from your clan.',
	long: 'Kick a user from your clan. You can kick using a mention, Discord#tag or by using their number from the clan member list.',
	args: { '@user/discord#tag': 'User to kick.' },
	examples: ['clan kick @blobfysh', 'clan kick 3'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 4,

	async execute(app, message, { args, prefix, guildInfo }) {
		const scoreRow = await app.player.getRow(message.author.id)
		let member = app.parse.members(message, args)[0]
		const number = app.parse.numbers(args)[0]

		if (!member && number) {
			const members = await app.clans.getMembers(scoreRow.clanId)
			const memberId = members.memberIds[number - 1]

			if (!memberId) {
				return message.reply(`Please specify someone to kick. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
			}

			member = await app.common.fetchUser(memberId, { cacheIPC: false })
		}
		else if (!member) {
			return message.reply(`Please specify someone to kick. You can mention someone, use their Discord#tag, type their user ID, or use their number from \`${prefix}clan info\``)
		}

		const invitedScoreRow = await app.player.getRow(member.id)

		if (!invitedScoreRow) {
			return message.reply('❌ The person you\'re trying to search doesn\'t have an account!')
		}
		else if (invitedScoreRow.clanId !== scoreRow.clanId) {
			return message.reply('❌ That user is not in your clan.')
		}
		else if (message.author.id === member.id) {
			return message.reply('❌ You cannot kick yourself.')
		}
		else if (invitedScoreRow.clanRank >= scoreRow.clanRank) {
			return message.reply('You cannot kick members of equal or higher rank!')
		}

		await app.query(`UPDATE scores SET clanId = 0 WHERE userId = ${member.id}`)
		await app.query(`UPDATE scores SET clanRank = 0 WHERE userId = ${member.id}`)

		message.reply(`✅ Successfully kicked **${member.username}#${member.discriminator}**`)
	}
}
