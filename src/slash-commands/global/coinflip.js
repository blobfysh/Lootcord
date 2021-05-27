const { ApplicationCommandOptionType } = require('slash-commands')
const WIN_QUOTES = ['You just won **{0}**!', 'Wow you\'re pretty good at flipping this coin 👀 You won **{0}**!', 'Congratulations! You just won **{0}**!']
const LOSE_QUOTES = ['You just lost **{0}**!', 'Congratulations! You just lost **{0}**!']

exports.command = {
	name: 'coinflip',
	description: 'Flip a coin for a chance to win 2x what you bet.',
	requiresAcc: true,
	requiresActive: true,
	options: [
		{
			type: ApplicationCommandOptionType.INTEGER,
			name: 'amount',
			description: 'Amount to bet.',
			required: true
		}
	],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(interaction.member.user.id, serverSideGuildId)
		const coinflipCD = await app.cd.getCD(interaction.member.user.id, 'coinflip', { serverSideGuildId })
		const gambleAmount = interaction.data.options.find(opt => opt.name === 'amount').value

		if (coinflipCD) {
			return interaction.respond({
				content: `You need to wait \`${coinflipCD}\` before flipping another coin.`
			})
		}

		else if (!gambleAmount || gambleAmount < 100) {
			return interaction.respond({
				content: `Please specify an amount of at least **${app.common.formatNumber(100)}** to gamble!`
			})
		}

		else if (gambleAmount > row.money) {
			return interaction.respond({
				content: `❌ You don't have that much scrap! You currently have **${app.common.formatNumber(row.money)}**.`
			})
		}

		else if (gambleAmount > 50000) {
			return interaction.respond({
				content: `Woah there high roller, you cannot gamble more than **${app.common.formatNumber(50000)}** on coinflip.`
			})
		}

		if (Math.random() < 0.4) {
			await app.player.addMoney(interaction.member.user.id, gambleAmount, serverSideGuildId)

			if (gambleAmount >= 100000) {
				await app.itm.addBadge(interaction.member.user.id, 'gambler', serverSideGuildId)
			}

			await interaction.respond({
				content: WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount * 2))
			})
		}
		else {
			await app.player.removeMoney(interaction.member.user.id, gambleAmount, serverSideGuildId)

			await interaction.respond({
				content: LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount))
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'coinflip', app.config.cooldowns.coinflip * 1000, { serverSideGuildId })
	}
}
