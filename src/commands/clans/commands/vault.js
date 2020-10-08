const { ITEM_TYPES } = require('../../../resources/constants')

module.exports = {
	name: 'vault',
	aliases: ['inv', 'v'],
	description: 'Show the items in a clans vault.',
	long: 'Shows all items in a clans vault.',
	args: { 'clan/user': 'Clan or user to search, will default to your own clan if none specified.' },
	examples: ['clan vault Mod Squad'],
	requiresClan: false,
	requiresActive: false,
	minimumRank: 0,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const mentionedUser = app.parse.members(message, args)[0]

		if (!args.length && scoreRow.clanId === 0) {
			return message.reply('You are not a member of any clan! You can look up other clans by searching their name.')
		}
		else if (!args.length) {
			message.channel.createMessage(await getVaultInfo(app, scoreRow.clanId))
		}
		else if (mentionedUser !== undefined) {
			const mentionedScoreRow = await app.player.getRow(mentionedUser.id)
			if (!mentionedScoreRow) {
				return message.reply('❌ The person you\'re trying to search doesn\'t have an account!')
			}
			else if (mentionedScoreRow.clanId === 0) {
				return message.reply('❌ That user is not in a clan.')
			}

			message.channel.createMessage(await getVaultInfo(app, mentionedScoreRow.clanId))
		}
		else {
			const clanName = args.join(' ')
			const clanRow = await app.clans.searchClanRow(clanName)

			if (!clanRow) {
				return message.reply('I could not find a clan with that name! Maybe you misspelled it?')
			}

			message.channel.createMessage(await getVaultInfo(app, clanRow.clanId))
		}
	}
}

async function getVaultInfo(app, clanId) {
	const clanRow = await app.clans.getRow(clanId)
	const clanItems = await app.itm.getUserItems(await app.itm.getItemObject(clanId))

	const embedInfo = new app.Embed()
		.setColor('#9449d6')
		.setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
		.setTitle('Vault')

	if (clanRow.iconURL) {
		embedInfo.setThumbnail(clanRow.iconURL)
	}

	// item fields
	if (clanItems.ranged.length) {
		embedInfo.addField(ITEM_TYPES.ranged.name, clanItems.ranged.join('\n'), true)
	}

	if (clanItems.melee.length) {
		embedInfo.addField(ITEM_TYPES.melee.name, clanItems.melee.join('\n'), true)
	}

	if (clanItems.usables.length) {
		embedInfo.addField(ITEM_TYPES.items.name, clanItems.usables.join('\n'), true)
	}

	if (clanItems.ammo.length) {
		embedInfo.addField(ITEM_TYPES.ammo.name, clanItems.ammo.join('\n'), true)
	}

	if (clanItems.materials.length) {
		embedInfo.addField(ITEM_TYPES.materials.name, clanItems.materials.join('\n'), true)
	}

	if (clanItems.storage.length) {
		embedInfo.addField(ITEM_TYPES.storage.name, clanItems.storage.join('\n'), true)
	}

	if (!clanItems.ranged.length && !clanItems.melee.length && !clanItems.usables.length && !clanItems.ammo.length && !clanItems.materials.length && !clanItems.storage.length) {
		embedInfo.addField('This vault is empty!', '\u200b')
	}

	embedInfo.addField('\u200b', `Power (slots) used: ${clanItems.itemCount} | Vault value: ${app.common.formatNumber(clanItems.invValue)}`)

	return embedInfo
}
