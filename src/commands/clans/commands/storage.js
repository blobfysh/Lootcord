const { ITEM_TYPES, CLANS } = require('../../../resources/constants')
const { getPageCount } = require('../../info/inventory')
const { reply } = require('../../../utils/messageUtils')

const ITEMS_PER_PAGE = 15

exports.command = {
	name: 'storage',
	aliases: ['vault', 'inv', 'v', 'inventory'],
	description: 'Shows all items in a clans storage.',
	long: 'Shows all items in a clans storage.',
	args: { 'clan/user': 'Clan or user to search, will default to your own clan if none specified.' },
	examples: ['clan inv Mod Squad', 'clan storage @blobfysh'],
	requiresClan: false,
	requiresActive: false,
	minimumRank: 0,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const mentionedUser = app.parse.members(message, args)[0]

		if (!args.length && scoreRow.clanId === 0) {
			return reply(message, 'You are not a member of any clan! You can look up other clans by searching their name.')
		}
		else if (!args.length) {
			app.btnCollector.paginate(message, await generatePages(app, scoreRow.clanId, serverSideGuildId))
		}
		else if (mentionedUser !== undefined) {
			const mentionedScoreRow = await app.player.getRow(mentionedUser.id, serverSideGuildId)
			if (!mentionedScoreRow) {
				return reply(message, '❌ The person you\'re trying to search doesn\'t have an account!')
			}
			else if (mentionedScoreRow.clanId === 0) {
				return reply(message, '❌ That user is not in a clan.')
			}

			app.btnCollector.paginate(message, await generatePages(app, mentionedScoreRow.clanId, serverSideGuildId))
		}
		else {
			const clanName = args.join(' ')
			const clanRow = await app.clans.searchClanRow(clanName, serverSideGuildId)

			if (!clanRow) {
				return reply(message, 'I could not find a clan with that name! Maybe you misspelled it?')
			}

			app.btnCollector.paginate(message, await generatePages(app, clanRow.clanId, serverSideGuildId))
		}
	}
}

async function generatePages (app, clanId, serverSideGuildId) {
	const messages = []
	const clanRow = await app.clans.getRow(clanId, serverSideGuildId)
	const clanItems = app.itm.getUserItems(await app.clans.getItemObject(clanId, serverSideGuildId))

	const vaultPageCount = getPageCount(clanItems)

	for (let i = 1; i < vaultPageCount + 1; i++) {
		const indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE
		const indexLast = ITEMS_PER_PAGE * i

		const embedInfo = new app.Embed({ maxFieldWidth: 2 })
			.setColor(13451564)
			.setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
			.setTitle('Clan Storage')

		if (clanRow.iconURL) {
			embedInfo.setThumbnail(clanRow.iconURL)
		}
		else {
			embedInfo.setThumbnail(CLANS.levels[clanRow.level].image)
		}


		// item fields
		if (clanItems.ranged.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.ranged.name, clanItems.ranged.slice(indexFirst, indexLast).join('\n'), true)
		}

		if (clanItems.melee.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.melee.name, clanItems.melee.slice(indexFirst, indexLast).join('\n'), true)
		}

		if (clanItems.usables.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.items.name, clanItems.usables.slice(indexFirst, indexLast).join('\n'), true)
		}

		if (clanItems.ammo.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.ammo.name, clanItems.ammo.slice(indexFirst, indexLast).join('\n'), true)
		}

		if (clanItems.resources.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.resources.name, clanItems.resources.slice(indexFirst, indexLast).join('\n'), true)
		}

		if (clanItems.storage.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.storage.name, clanItems.storage.slice(indexFirst, indexLast).join('\n'), true)
		}

		if (!clanItems.ranged.length && !clanItems.melee.length && !clanItems.usables.length && !clanItems.ammo.length && !clanItems.resources.length && !clanItems.storage.length) {
			embedInfo.addField('The storage is empty!', '\u200b')
		}

		// add page count if there are multiple pages
		if (vaultPageCount > 1) {
			embedInfo.setFooter(`Page ${i}/${vaultPageCount}`)
		}

		embedInfo.addField('\u200b', `Storage space: ${clanItems.itemCount} / ${CLANS.levels[clanRow.level].itemLimit} max | Value: ${app.common.formatNumber(clanItems.invValue)}`)

		messages.push(embedInfo)
	}

	return messages
}
