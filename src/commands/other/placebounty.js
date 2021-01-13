module.exports = {
	name: 'placebounty',
	aliases: [''],
	description: 'Place a bounty on another player that can be claimed by whoever kills that player.',
	long: 'Place a bounty on another player that can be claimed by whoever kills that player. If nobody claims the bounty you place within the week, you will receive that money back.',
	args: {
		'@user/discord#tag': 'User to place bounty on.',
		'amount': 'Amount of Lootcoin for bounty.'
	},
	examples: ['placebounty blobfysh#4679 10000'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const row = await app.player.getRow(message.author.id)
		const memberArg = app.parse.members(message, args)[0]
		const hitAmount = app.parse.numbers(args)[0]

		// no member found in ArgParser
		if (!memberArg) {
			if (args.length) {
				return message.reply('❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID')
			}

			return message.reply('❌ You need to mention the user you want to place a bounty on.')
		}
		// validate amount
		else if (!hitAmount) {
			return message.reply('❌ Please specify an amount for this bounty.')
		}
		else if (hitAmount < 100) {
			return message.reply(`❌ Please enter an amount of at least ${app.common.formatNumber(100)}`)
		}
		else if (row.money < hitAmount) {
			return message.reply(`❌ You don't have enough money! You currently have **${app.common.formatNumber(row.money)}**`)
		}

		const victimRow = await app.player.getRow(memberArg.id)

		if (memberArg.id === message.author.id) {
			return message.reply('❌ You can\'t place a bounty on yourself.')
		}
		else if (!victimRow) {
			return message.reply('❌ The person you\'re trying to place a bounty on doesn\'t have an account.')
		}
		else if (row.clanId !== 0 && row.clanId === victimRow.clanId) {
			return message.reply('❌ You cannot place a bounty on a member of your own clan.')
		}

		const botMessage = await message.reply(`You are about to place a **${app.common.formatNumber(hitAmount)}** bounty on ${memberArg.username}#${memberArg.discriminator}.\n\n**Are you sure?**`)

		try {
			const result = await app.react.getConfirmation(message.author.id, botMessage, 15000)

			if (result) {
				const row2 = await app.player.getRow(message.author.id)

				if (row2.money < hitAmount) {
					return botMessage.edit(`❌ You don't have enough money! You currently have **${app.common.formatNumber(row.money)}**`)
				}

				await app.bountyHandler.addBounty(message.author.id, memberArg.id, hitAmount)
				await app.player.removeMoney(message.author.id, hitAmount)

				botMessage.edit(`✅ Successfully placed **${app.common.formatNumber(hitAmount)}** bounty on ${memberArg.username}#${memberArg.discriminator}.`)
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit('You didn\'t react in time!')
		}
	}
}
