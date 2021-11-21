const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

const active = new Set()

exports.command = {
	name: 'craft',
	aliases: [],
	description: 'Craft new items!',
	long: 'Use components from recycling to craft items such as:\n`semi_pistol`\n`wood_box`\n`rifle_bullet`.',
	args: { item: 'Item to craft.', amount: '**OPTIONAL** Amount of items to craft.' },
	examples: ['craft c4 2'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const craftItem = app.parse.items(args)[0]
		let craftAmount = app.parse.numbers(args)[0] || 1

		if (active.has(message.author.id)) {
			return reply(message, '❌ You already have a `craft` command active.')
		}
		else if (craftItem) {
			if (app.itemdata[craftItem].craftedWith === '') {
				return reply(message, `${app.itemdata[craftItem].icon}\`${craftItem}\` cannot be crafted!`)
			}
			else if (app.itemdata[craftItem].craftedWith.level > row.level) {
				return reply(message, `❌ You must be at least level **${app.itemdata[craftItem].craftedWith.level}** to craft a ${app.itemdata[craftItem].icon}\`${craftItem}\`. You are only level **${row.level}**.`)
			}

			if (craftAmount > 20) craftAmount = 20

			const itemMats = getItemMats(app.itemdata[craftItem].craftedWith.materials, craftAmount).sort(app.itm.sortItemsHighLow.bind(app))

			const embedInfo = new app.Embed()
				.setDescription(`Craft **${craftAmount}x** ${app.itemdata[craftItem].icon}\`${craftItem}\` for:\n\n${app.itm.getDisplay(itemMats).join('\n')}`)
				.setColor('#818181')
				.setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/601372871301791755/craft.png')

			active.add(message.author.id)

			const botMessage = await message.channel.createMessage({
				content: `<@${message.author.id}>`,
				embed: embedInfo.embed,
				components: BUTTONS.confirmation
			})

			try {
				const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

				if (confirmed.customID === 'confirmed') {
					const userItems = await app.itm.getItemObject(message.author.id, serverSideGuildId)
					const itemCt = await app.itm.getItemCount(userItems, row)

					if (app.itemdata[craftItem].isBanner && itemCt.bannerCt + craftAmount > 1000) {
						await confirmed.respond({
							content: '❌ **Crafting that will put you over the banner limit!** (1,000)',
							components: []
						})
					}
					else if (await app.itm.hasItems(userItems, itemMats)) {
						const xpReward = app.itemdata[craftItem].craftedWith.xpReward * craftAmount
						await app.itm.removeItem(message.author.id, itemMats, null, serverSideGuildId)
						await app.itm.addItem(message.author.id, craftItem, craftAmount, serverSideGuildId)
						await app.player.addPoints(message.author.id, xpReward, serverSideGuildId)

						embedInfo.setColor(9043800)
						embedInfo.setDescription(`Successfully crafted **${craftAmount}x** ${app.itemdata[craftItem].icon}\`${craftItem}\` (\`⭐ ${xpReward} XP EARNED\`)`)

						await confirmed.respond({
							embeds: [embedInfo.embed],
							components: []
						})
					}
					else {
						const needed = []

						for (let i = 0; i < itemMats.length; i++) {
							// do stuff for each item
							const itemToCheck = itemMats[i].split('|')
							if (!userItems[itemToCheck[0]] || userItems[itemToCheck[0]] < parseInt(itemToCheck[1])) {
								needed.push(itemMats[i])
							}
						}

						embedInfo.setColor(16734296)
						embedInfo.setDescription(`You are missing the required materials for this item:\n\n${app.itm.getDisplay(needed).join('\n')}`)

						await confirmed.respond({
							embeds: [embedInfo.embed],
							components: []
						})
					}
				}
				else {
					await botMessage.delete()
				}
			}
			catch (err) {
				const errorEmbed = new app.Embed()
					.setColor(16734296)
					.setDescription('❌ Command timed out.')

				await botMessage.edit({
					embed: errorEmbed.embed,
					components: []
				})
			}
			finally {
				active.delete(message.author.id)
			}
		}
		else {
			await reply(message, `I don't recognize that item. \`${prefix}craft <item>\``)
		}
	}
}

function getItemMats (itemMats, craftAmount) {
	const itemPrice = []

	for (let i = 0; i < itemMats.length; i++) {
		const matAmount = itemMats[i].split('|')

		itemPrice.push(`${matAmount[0]}|${matAmount[1] * craftAmount}`)
	}

	return itemPrice
}
