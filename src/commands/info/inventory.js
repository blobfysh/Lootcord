const { ITEM_TYPES } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')
const ITEMS_PER_PAGE = 15

exports.command = {
	name: 'inventory',
	aliases: ['inv', 'i'],
	description: 'Displays all items you have.',
	long: 'Shows your current inventory including items, health, level, xp, and money.',
	args: {
		'@user/discord#tag': 'User\'s profile to check.'
	},
	examples: ['inv blobfysh#4679'],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const memberArg = app.parse.members(message, args)[0]

		// no member found in ArgParser
		if (!memberArg) {
			// player was trying to search someone
			if (args.length) {
				return reply(message, '❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID')
			}

			app.btnCollector.paginate(message, await generatePages(app, message.author, message.channel.guild.id, serverSideGuildId))
		}
		else {
			app.btnCollector.paginate(message, await generatePages(app, memberArg, message.channel.guild.id, serverSideGuildId))
		}
	}
}

const generatePages = exports.generatePages = async function generatePages (app, user, guildId, serverSideGuildId) {
	const messages = []

	try {
		const userRow = await app.player.getRow(user.id, serverSideGuildId)

		if (!userRow) {
			messages.push({
				content: '❌ The person you\'re trying to search doesn\'t have an account!'
			})

			return messages
		}

		const isActive = guildId ? await app.player.isActive(user.id, guildId) : false
		const itemObject = await app.itm.getItemObject(user.id, serverSideGuildId)
		const usersItems = await app.itm.getUserItems(itemObject)
		const itemCt = await app.itm.getItemCount(itemObject, userRow)
		const armorLeft = await app.cd.getCD(user.id, 'shield', { serverSideGuildId })
		const armor = await app.player.getArmor(user.id, serverSideGuildId)
		const passiveShield = await app.cd.getCD(user.id, 'passive_shield', { serverSideGuildId })

		// check how many pages are needed for this inventory
		const invPageCount = getPageCount(usersItems)

		for (let i = 1; i < invPageCount + 1; i++) {
			const indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE
			const indexLast = ITEMS_PER_PAGE * i

			const embedInfo = new app.Embed()
				.setTitle(`${isActive ? app.icons.accounts.active : app.icons.accounts.inactive} ${`${user.username}#${user.discriminator}`}'s Inventory`)
				.setColor(13451564)

			if (armorLeft) {
				embedInfo.addField(armor ? 'Armor' : '🛡️ Armor', armor ? `${app.itemdata[armor].icon}\`${armor}\` (\`${armorLeft}\`)` : `\`${armorLeft}\``)
			}
			if (passiveShield) {
				embedInfo.addField('🛡️ Passive Shield', `\`${passiveShield}\` [?](https://lootcord.com/faq#what-is-a-passive-shield 'A passive shield is a 24 hour attack shield given to you when you are killed.\n\nThis shield will automatically be removed if you decide to attack someone.')`)
			}

			let healthStr = `**${userRow.health} / ${userRow.maxHealth}** HP\n${app.player.getHealthIcon(userRow.health, userRow.maxHealth)}`

			if (userRow.bleed > 0) {
				healthStr += `\n🩸 Bleeding: **${userRow.bleed}**`
			}
			if (userRow.burn > 0) {
				healthStr += `\n🔥 Burning: **${userRow.burn}**`
			}

			embedInfo.addField('Health', healthStr, true)

			embedInfo.addField('Money', app.common.formatNumber(userRow.money), true)

			if (userRow.backpack === 'none') {
				embedInfo.addField('Storage Container', 'None equipped', true)
			}
			else {
				embedInfo.addField('Storage Container', `${app.itemdata[userRow.backpack].icon}\`${userRow.backpack}\``, true)
			}

			embedInfo.addBlankField()

			// item fields
			if (usersItems.ranged.slice(indexFirst, indexLast).length) {
				embedInfo.addField(ITEM_TYPES.ranged.name, usersItems.ranged.slice(indexFirst, indexLast).join('\n'), true)
			}

			if (usersItems.melee.slice(indexFirst, indexLast).length) {
				embedInfo.addField(ITEM_TYPES.melee.name, usersItems.melee.slice(indexFirst, indexLast).join('\n'), true)
			}

			if (usersItems.usables.slice(indexFirst, indexLast).length) {
				embedInfo.addField(ITEM_TYPES.items.name, usersItems.usables.slice(indexFirst, indexLast).join('\n'), true)
			}

			if (usersItems.ammo.slice(indexFirst, indexLast).length) {
				embedInfo.addField(ITEM_TYPES.ammo.name, usersItems.ammo.slice(indexFirst, indexLast).join('\n'), true)
			}

			if (usersItems.resources.slice(indexFirst, indexLast).length) {
				embedInfo.addField(ITEM_TYPES.resources.name, usersItems.resources.slice(indexFirst, indexLast).join('\n'), true)
			}

			if (usersItems.storage.slice(indexFirst, indexLast).length) {
				embedInfo.addField(ITEM_TYPES.storage.name, usersItems.storage.slice(indexFirst, indexLast).join('\n'), true)
			}

			if (!usersItems.ranged.length && !usersItems.melee.length && !usersItems.usables.length && !usersItems.ammo.length && !usersItems.resources.length && !usersItems.storage.length) {
				embedInfo.addField('This inventory is empty! :(', '\u200b')
			}

			// add page count if there are multiple pages
			if (invPageCount > 1) {
				embedInfo.setFooter(`Page ${i}/${invPageCount}`)
			}

			embedInfo.addField('\u200b', `Inventory space: ${itemCt.capacity} max | Value: ${app.common.formatNumber(usersItems.invValue + userRow.money)}`)

			messages.push(embedInfo)
		}

		return messages
	}
	catch (err) {
		console.log(err)
		messages.push({
			content: '❌ There was an error trying to fetch inventory. Make sure you mention the user.'
		})

		return messages
	}
}

const getPageCount = exports.getPageCount = function getPageCount (items) {
	let pages = 1
	const pagesNeeded = {
		melee: Math.ceil(items.melee.length / ITEMS_PER_PAGE),
		ranged: Math.ceil(items.ranged.length / ITEMS_PER_PAGE),
		items: Math.ceil(items.usables.length / ITEMS_PER_PAGE),
		ammo: Math.ceil(items.ammo.length / ITEMS_PER_PAGE),
		resources: Math.ceil(items.resources.length / ITEMS_PER_PAGE),
		storage: Math.ceil(items.storage.length / ITEMS_PER_PAGE)
	}

	for (const type in pagesNeeded) {
		if (pagesNeeded[type] > pages) {
			pages = pagesNeeded[type]
		}
	}

	return pages
}
