const { ITEM_TYPES } = require('../../resources/constants')

module.exports = {
	name: 'items',
	aliases: ['item', 'recipe'],
	description: 'Shows information about an item.',
	long: 'Specify an item to see detailed information about it.',
	args: { item: 'Item to search.' },
	examples: ['item assault_rifle'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

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
			embedItem.addBlankField(true)

			if (itemInfo.cooldown !== '') {
				embedItem.addField('Cooldown', `\`${app.cd.convertTime(itemInfo.cooldown.seconds * 1000)}\``, true)
			}
			if (itemInfo.chanceToBreak) {
				embedItem.addField('Chance to break', `\`${itemInfo.chanceToBreak * 100}%\``, true)
			}

			if (itemInfo.isWeap) {
				if (itemInfo.ammo !== '') {
					embedItem.addField('Damage', itemInfo.ammo.sort(app.itm.sortItemsHighLow.bind(app))
						.map(ammo => `${app.itemdata[ammo].icon}\`${ammo}\` ${app.itemdata[ammo].damage + itemInfo.minDmg} - ${app.itemdata[ammo].damage + itemInfo.maxDmg}${getStatusEffectStr(app.itemdata[ammo])}`)
						.join('\n'))
				}
				else {
					embedItem.addField('Damage', `${itemInfo.minDmg} - ${itemInfo.maxDmg}`, true)
				}
			}

			if (itemInfo.category === 'Ammo') {
				const ammoFor = itemsArraySorted.filter(item => app.itemdata[item].ammo !== '' && app.itemdata[item].ammo.includes(itemSearched))

				embedItem.addField('Damage', itemInfo.damage + getStatusEffectStr(itemInfo), true)
				embedItem.addField('Ammo for:', ammoFor.map(weapon => `${app.itemdata[weapon].icon}\`${weapon}\``).join('\n'), true)
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
				embedItem.addField('🔩 Crafted with:', `⭐ __Level **${itemInfo.craftedWith.level}**+__\n\n${app.itm.getDisplay(itemInfo.craftedWith.materials.sort(app.itm.sortItemsHighLow.bind(app))).join('\n')}`, true)
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
			const meleeWeapons = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Melee')
			const rangedWeapons = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ranged')
			const items = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Item')
			const ammo = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ammo')
			const material = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Material')
			const storage = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Storage')
			const banners = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Banner')

			const embedInfo = new app.Embed()
				.setColor(13451564)
				.setTitle('Full Items List')
				.addField(ITEM_TYPES.ranged.name, rangedWeapons.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.addField(ITEM_TYPES.melee.name, meleeWeapons.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.addField(ITEM_TYPES.items.name, items.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.addField(ITEM_TYPES.ammo.name, ammo.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.addField(ITEM_TYPES.materials.name, material.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.addField(ITEM_TYPES.storage.name, storage.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.addField(ITEM_TYPES.banners.name, banners.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
				.setFooter(`Use ${prefix}item <item> to retrieve more information!`)

			message.channel.createMessage(embedInfo)
		}
		else {
			message.reply(`I don't recognize that item. Use \`${prefix}items\` to see a full list!`)
		}
	}
}

function getStatusEffectStr(item) {
	if (item.bleed > 0) {
		return ` + 🩸${item.bleed} bleed`
	}
	else if (item.burn > 0) {
		return ` + 🔥${item.burn} burn`
	}

	return ''
}
