const { ITEM_TYPES } = require('../../resources/constants')
const ITEMS_PER_PAGE = 15

exports.command = {
	name: 'items',
	aliases: ['item', 'recipe'],
	description: 'Shows information about an item.',
	long: 'Specify an item to see detailed information about it.',
	args: { item: 'Item to search.' },
	examples: ['item assault_rifle'],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute(app, message, { args, prefix, guildInfo }) {
		const itemsArraySorted = Object.keys(app.itemdata).sort(app.itm.sortItemsHighLow.bind(app))
		const itemSearched = app.parse.items(args)[0]
		const itemChoice = (args[0] || '').toLowerCase()

		if (itemSearched) {
			const itemInfo = app.itemdata[itemSearched]
			let itemDesc = itemInfo.desc

			const embedItem = new app.Embed()
				.setTitle(`${itemInfo.icon} ${itemSearched}`)
				.setColor(13451564)

			if (itemInfo.isBanner) {
				embedItem.setImage(itemInfo.image)
				embedItem.setColor(itemInfo.bannerColor)
			}
			else if (itemInfo.image) {
				embedItem.setThumbnail(itemInfo.image)
			}

			if (itemInfo.artist !== '') {
				const artistInfo = await app.common.fetchUser(itemInfo.artist, { cacheIPC: false })

				embedItem.setFooter(`Art by ${artistInfo.username}#${artistInfo.discriminator}`)
			}

			// if item is a box =>
			if (itemInfo.rates !== undefined) {
				const possibleItems = []

				Object.keys(itemInfo.rates).forEach(rate => {
					for (let i = 0; i < itemInfo.rates[rate].items.length; i++) {
						possibleItems.push(itemInfo.rates[rate].items[i].split('|')[0])
					}
				})

				itemDesc += `\n\n**Possible items:** ${possibleItems.sort(app.itm.sortItemsHighLow.bind(app)).map(item => `${app.itemdata[item].icon}\`${item}\``).join(', ')}`
			}

			if (!itemInfo.canBeStolen) {
				embedItem.setDescription(`${itemDesc}\n\`\`\`css\nThis item binds to the user when received, and cannot be traded or stolen.\`\`\``)
			}
			else if (itemDesc !== '') {
				embedItem.setDescription(itemDesc)
			}

			embedItem.addField('Type', itemInfo.category === 'Storage' ? 'Storage Container' : itemInfo.category, true)
			embedItem.addField('Tier', itemInfo.tier === 0 ? 'None' : `Tier ${app.icons.tiers[itemInfo.tier]}`, true)

			if (itemInfo.cooldown !== '') {
				embedItem.addField('Cooldown', `\`${app.cd.convertTime(itemInfo.cooldown.seconds * 1000)}\``, true)
			}
			if (itemInfo.chanceToBreak) {
				embedItem.addField('Chance to break', `\`${itemInfo.chanceToBreak * 100}%\``, true)
			}
			else if (itemInfo.breaksOnUse) {
				embedItem.addField('Chance to break', '100% (item always breaks)', true)
			}

			if (itemInfo.buy.currency !== undefined && (itemInfo.buy.currency === 'money' || itemInfo.buy.currency === 'scrap')) {
				embedItem.addField('Buy', app.common.formatNumber(itemInfo.buy.amount, false, itemInfo.buy.currency === 'scrap'), true)
			}
			else if (itemInfo.buy.currency !== undefined) {
				embedItem.addField('Buy', `${itemInfo.buy.amount}x ${app.itemdata[itemInfo.buy.currency].icon}\`${itemInfo.buy.currency}\``, true)
			}

			if (itemInfo.sell !== '') {
				embedItem.addField('Sell', app.common.formatNumber(itemInfo.sell), true)
			}

			if (['Ranged', 'Melee'].includes(itemInfo.category)) {
				if (itemInfo.ammo !== '') {
					embedItem.addField('Damage', itemInfo.ammo.sort(app.itm.sortItemsHighLow.bind(app))
						.map(ammo => `${app.itemdata[ammo].icon}\`${ammo}\` ${app.itemdata[ammo].damage + itemInfo.minDmg} - ${app.itemdata[ammo].damage + itemInfo.maxDmg}${getStatusEffectStr(app.itemdata[ammo])}`)
						.join('\n'))
				}
				else {
					embedItem.addField('Damage', `${itemInfo.minDmg} - ${itemInfo.maxDmg}`, true)
				}
			}

			const ammoFor = itemsArraySorted.filter(item => app.itemdata[item].ammo !== '' && app.itemdata[item].ammo.includes(itemSearched))

			if (ammoFor.length) {
				embedItem.addField('Damage', ammoFor.sort(app.itm.sortItemsHighLow.bind(app))
					.map(weapon => `${app.itemdata[weapon].icon}\`${weapon}\` ${itemInfo.damage + app.itemdata[weapon].minDmg} - ${itemInfo.damage + app.itemdata[weapon].maxDmg}${getStatusEffectStr(itemInfo)}`)
					.join('\n'))
			}

			const craftItems = []
			const recycledFrom = []

			for (const item of itemsArraySorted) {
				if (app.itemdata[item].craftedWith !== '') {
					for (let i = 0; i < app.itemdata[item].craftedWith.materials.length; i++) {
						if (app.itemdata[item].craftedWith.materials[i].split('|')[0] === itemSearched) {
							craftItems.push(`${app.itemdata[item].icon}\`${item}\``)
						}
					}
				}

				if (app.itemdata[item].recyclesTo.materials.length) {
					for (let i = 0; i < app.itemdata[item].recyclesTo.materials.length; i++) {
						if (app.itemdata[item].recyclesTo.materials[i].split('|')[0] === itemSearched) {
							recycledFrom.push(`${app.itemdata[item].icon}\`${item}\``)
						}
					}
				}
			}

			if (itemInfo.craftedWith !== '' || itemInfo.recyclesTo.materials.length || craftItems.length || recycledFrom.length) embedItem.addBlankField()

			if (itemInfo.craftedWith !== '') {
				embedItem.addField('🔩 Crafting:', `Required Level: **${itemInfo.craftedWith.level}+**\nReward: \`⭐ ${itemInfo.craftedWith.xpReward} XP\`\n\nRecipe:\n${app.itm.getDisplay(itemInfo.craftedWith.materials.sort(app.itm.sortItemsHighLow.bind(app))).join('\n')}`, true)
			}
			if (itemInfo.recyclesTo.materials.length) {
				embedItem.addField('♻ Recycles into:', app.itm.getDisplay(itemInfo.recyclesTo.materials.sort(app.itm.sortItemsHighLow.bind(app))).join('\n'), true)
			}

			if (craftItems.length) {
				embedItem.addField('Used to craft:', craftItems.join('\n'), true)
			}
			if (recycledFrom.length) {
				embedItem.addField('Recycled from:', recycledFrom.join('\n'), true)
			}

			message.channel.createMessage(embedItem)
		}
		else if (!itemChoice) {
			app.react.paginate(message, generatePages(app, itemsArraySorted, prefix))
		}
		else {
			message.reply(`I don't recognize that item. Use \`${prefix}items\` to see a full list!`)
		}
	}
}

function generatePages(app, items, prefix) {
	const messages = []
	items = {
		melee: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Melee'),
		ranged: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Ranged'),
		items: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Item'),
		ammo: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Ammo'),
		resources: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Resource'),
		storage: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Storage'),
		banners: items.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Banner')
	}

	const itemsPageCount = getItemsPageCount(items)

	for (let i = 1; i < itemsPageCount + 1; i++) {
		const indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE
		const indexLast = ITEMS_PER_PAGE * i

		const embedInfo = new app.Embed()
			.setColor(13451564)
			.setTitle('Full Items List')
			.setDescription(`Use \`${prefix}item <item>\` to retrieve more information!`)

		// item fields
		if (items.ranged.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.ranged.name, items.ranged.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		if (items.melee.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.melee.name, items.melee.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		if (items.items.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.items.name, items.items.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		if (items.ammo.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.ammo.name, items.ammo.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		if (items.resources.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.resources.name, items.resources.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		if (items.storage.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.storage.name, items.storage.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		if (items.banners.slice(indexFirst, indexLast).length) {
			embedInfo.addField(ITEM_TYPES.banners.name, items.banners.slice(indexFirst, indexLast).map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		}

		messages.push(embedInfo)
	}

	return messages
}

function getItemsPageCount(items) {
	let pages = 1

	const pagesNeeded = {
		melee: Math.ceil(items.melee.length / ITEMS_PER_PAGE),
		ranged: Math.ceil(items.ranged.length / ITEMS_PER_PAGE),
		items: Math.ceil(items.length / ITEMS_PER_PAGE),
		ammo: Math.ceil(items.ammo.length / ITEMS_PER_PAGE),
		resources: Math.ceil(items.resources.length / ITEMS_PER_PAGE),
		storage: Math.ceil(items.storage.length / ITEMS_PER_PAGE),
		banners: Math.ceil(items.banners.length / ITEMS_PER_PAGE)
	}

	for (const type in pagesNeeded) {
		if (pagesNeeded[type] > pages) {
			pages = pagesNeeded[type]
		}
	}

	return pages
}

function getStatusEffectStr(item) {
	if (item.bleed > 0) {
		return `** + 🩸 ${item.bleed} bleed**`
	}
	else if (item.burn > 0) {
		return `** + 🔥 ${item.burn} burn**`
	}

	return ''
}
