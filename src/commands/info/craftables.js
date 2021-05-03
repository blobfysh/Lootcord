const { ITEM_TYPES } = require('../../resources/constants')

exports.command = {
	name: 'craftables',
	aliases: ['craftable'],
	description: 'Shows all items you can currently craft.',
	long: 'Shows all items you can currently craft using the items in your inventory.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
		const itemsSorted = Object.keys(app.itemdata).sort(app.itm.sortItemsHighLow.bind(app))
		const craftableItems = itemsSorted.filter(item => app.itemdata[item].craftedWith !== '' && app.itemdata[item].craftedWith.level <= row.level)
		const craftables = []

		for (let i = 0; i < craftableItems.length; i++) {
			if (canCraft(craftableItems[i])) {
				craftables.push(`${craftableItems[i]}|${maxCraft(craftableItems[i])}`)
			}
		}

		for (let i = 0; i < craftables.length; i++) {
			const itemAmount = craftables[i].split('|')
			craftables[i] = `${itemAmount[1]}x ${app.itemdata[itemAmount[0]].icon}\`${itemAmount[0]}\``
		}

		function canCraft(item) {
			const data = app.itemdata[item]

			for (let i = 0; i < data.craftedWith.materials.length; i++) {
				const matName = data.craftedWith.materials[i].split('|')[0]
				const matAmnt = data.craftedWith.materials[i].split('|')[1]

				if (userItems[matName] === undefined || userItems[matName] < matAmnt) return false
			}

			return true
		}

		function maxCraft(item) {
			const data = app.itemdata[item]
			const max = []

			for (let i = 0; i < data.craftedWith.materials.length; i++) {
				const matName = data.craftedWith.materials[i].split('|')[0]
				const matAmnt = data.craftedWith.materials[i].split('|')[1]

				max.push(Math.floor(userItems[matName] / matAmnt))
			}

			return max.sort((a, b) => a - b)[0]
		}

		const meleeWeapons = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Melee')
		const rangedWeapons = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Ranged')
		const items = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Item')
		const ammo = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Ammo')
		const resources = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Resource')
		const storage = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Storage')
		const banners = craftableItems.filter(item => !app.itemdata[item].isHidden && app.itemdata[item].category === 'Banner')

		const craftableEmb = new app.Embed()
			.setTitle('Craftables')
			.setDescription(`**Items you are a high enough level to craft:**${craftableItems.length ? '' : '\nNothing, you should level up more!'}`)
			.setColor(13451564)

		craftableEmb.addField(ITEM_TYPES.ranged.name, rangedWeapons.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		craftableEmb.addField(ITEM_TYPES.melee.name, meleeWeapons.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		craftableEmb.addField(ITEM_TYPES.items.name, items.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		craftableEmb.addField(ITEM_TYPES.ammo.name, ammo.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		craftableEmb.addField(ITEM_TYPES.resources.name, resources.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		craftableEmb.addField(ITEM_TYPES.storage.name, storage.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)
		craftableEmb.addField(ITEM_TYPES.banners.name, banners.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n'), true)

		craftableEmb.addField('\u200b', `**These are the items you can craft right now:**\n${craftables.length ? craftables.join('\n') : 'You don\'t have the materials to craft anything right now!'}`)

		message.channel.createMessage(craftableEmb)
	}
}
