const { InteractionResponseType, ApplicationCommandOptionType } = require('slash-commands')
const WIN_QUOTES = ['You just won **{0}**!', 'Wow you\'re pretty good at flipping this coin 👀 You won **{0}**!', 'Congratulations! You just won **{0}**!']
const LOSE_QUOTES = ['You just lost **{0}**!', 'Congratulations! You just lost **{0}**!']

exports.command = {
	name: 'coinflip',
	description: 'Gamble your Scrap for a 50% chance of winning 2x what you bet.',
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
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `You need to wait \`${coinflipCD}\` before flipping another coin.`
				}
			})
		}

		else if (!gambleAmount || gambleAmount < 100) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `Please specify an amount of at least **${app.common.formatNumber(100, false, true)}** to gamble!`
				}
			})
		}

		else if (gambleAmount > row.scrap) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `❌ You don't have that much Scrap! You currently have **${app.common.formatNumber(row.scrap, false, true)}**. You can trade your ${app.icons.money} Lootcoin for ${app.icons.scrap} Scrap: \`t-buy scrap <amount>\``
				}
			})
		}

		else if (gambleAmount > 1000000) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `Woah there high roller, you cannot gamble more than **${app.common.formatNumber(1000000, false, true)}** on coinflip.`
				}
			})
		}

		if (Math.random() < 0.5) {
			await app.player.addScrap(interaction.member.user.id, gambleAmount, serverSideGuildId)

			if (gambleAmount >= 1000000) {
				await app.itm.addBadge(interaction.member.user.id, 'gambler', serverSideGuildId)
			}

			await interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount * 2, false, true))
				}
			})
		}
		else {
			await app.player.removeScrap(interaction.member.user.id, gambleAmount, serverSideGuildId)

			await interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount, false, true))
				}
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'coinflip', app.config.cooldowns.coinflip * 1000, { serverSideGuildId })
	}
}
