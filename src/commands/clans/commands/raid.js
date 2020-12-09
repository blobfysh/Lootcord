module.exports = {
	name: 'raid',
	aliases: [''],
	description: 'Raid another clan.',
	long: 'Raid another clan.',
	args: { clan: 'Name of clan to raid.' },
	examples: ['clan raid Mod Squad'],
	requiresClan: true,
	requiresActive: true,
	minimumRank: 1,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const raidCD = await app.cd.getCD(scoreRow.clanId, 'raid')

		if (scoreRow.clanId === 0) {
			return message.reply('❌ You are not a member of any clan.')
		}
		else if (!args.length) {
			return message.reply('❌ You need to specify the name of the clan you want to raid.')
		}
		else if (raidCD) {
			return message.reply(`Your clan just raided! Wait \`${raidCD}\` before raiding another clan.`)
		}

		const clanName = args.join(' ')

		const clanRow = await app.clans.searchClanRow(clanName)

		if (!clanRow) {
			return message.reply('I could not find a clan with that name! Maybe you misspelled it?')
		}
		else if (clanRow.clanId === scoreRow.clanId) {
			return message.reply('Raiding yourself???? What.')
		}
		else if (await app.cd.getCD(clanRow.clanId, 'raided')) {
			return message.reply('That clan just got raided! Let the clan recuperate before raiding them again.')
		}

		const raider = await app.clans.getRow(scoreRow.clanId)
		const clanPower = await app.clans.getClanData(clanRow)
		const isRaidable = clanPower.usedPower > clanPower.currPower
		const itemsToSteal = clanPower.usedPower - clanPower.currPower

		const raidEmbed = new app.Embed()
			.setAuthor(`${message.author.username} | ${raider.name}`, message.author.avatarURL)
			.setDescription(`Raiding: \`${clanRow.name}\``)
			.setTitle(app.icons.loading)

		const botmsg = await message.channel.createMessage(raidEmbed)

		try {
			const raidableEmbed = new app.Embed()
				.setAuthor(`${message.author.username} | ${raider.name}`, message.author.avatarURL)

			if (!isRaidable) {
				raidableEmbed.setDescription(`❌ Raid failed!\n\n\`${clanRow.name}\` has **${clanPower.currPower}** current power and is only using **${clanPower.usedPower}** power in their vault.\n\nYou can only raid clans whose **used** power is greater than their **current** power.`)
				raidableEmbed.setColor(15083840)

				setTimeout(() => {
					botmsg.edit(raidableEmbed)
				}, 2000)

				return
			}

			const collectorObj = app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => m.author.id === message.author.id, { time: 120000 })

			raidableEmbed.setDescription(`Raid successful!\n\nChoose up to **${itemsToSteal}** items to steal from their vault.\n\nExample: \`${prefix}steal crate 2\` to steal 2 crates from the vault. Not sure what items they have? Check with \`${prefix}clan vault ${clanRow.name}\`.`)
			raidableEmbed.setFooter(`You have 2 minutes to pick the items. | You can type ${prefix}stop to end the raid early.`)
			raidableEmbed.setColor(8311585)
			setTimeout(() => {
				botmsg.edit(raidableEmbed)
			}, 2000)

			console.log('[CLANS] Someone is raiding right now.')
			app.clans.addLog(scoreRow.clanId, `${message.author.username} raided ${clanRow.name}`)
			app.clans.addLog(clanRow.clanId, `Raided by ${raider.name} (${`${message.author.username}#${message.author.discriminator}`})`)

			const moneyStolen = Math.floor(clanRow.money / 2) <= (clanPower.memberCount * 2000000) ? Math.floor(clanRow.money / 2) : clanPower.memberCount * 2000000
			let itemsStolen = 0
			const itemsArray = []

			await app.cd.setCD(clanRow.clanId, 'getting_raided', 130 * 1000, { ignoreQuery: true })
			await app.cd.setCD(clanRow.clanId, 'raided', 3600 * 1000 * 24)
			await app.cd.setCD(scoreRow.clanId, 'raid', 3600 * 1000)

			await app.clans.removeMoney(clanRow.clanId, moneyStolen)
			await app.clans.addMoney(scoreRow.clanId, moneyStolen)


			if ((await app.itm.getUserItems(await app.itm.getItemObject(clanRow.clanId))).itemCount === 0) {
				setTimeout(() => {
					app.msgCollector.stopCollector(collectorObj)
					message.channel.createMessage(`<@${message.author.id}>, -> Max items stolen. Ending raid.`)
				}, 2000)
			}

			collectorObj.collector.on('collect', async m => {
				if (!m.content.toLowerCase().startsWith(prefix)) return

				const userArgs = m.content.slice(prefix.length).split(/ +/)
				const command = userArgs[0] || ''
				const itemInput = userArgs.slice(1)
				const item = app.parse.items(itemInput)[0]
				const amount = app.parse.numbers(itemInput)[0] || 1

				if (command.toLowerCase() === 'stop' || command.toLowerCase() === 'end') {
					app.msgCollector.stopCollector(collectorObj)
					return m.channel.createMessage(`<@${m.author.id}>, -> Ending raid.`)
				}
				else if (command.toLowerCase() === 'steal' || command.toLowerCase() === 'take') {
					if (!item) { return }

					else if (amount + itemsStolen > itemsToSteal) {
						return m.channel.createMessage(`❌ Too many items! You can only steal ${itemsToSteal - itemsStolen} more items.`)
					}

					const clanItems = await app.itm.getItemObject(clanRow.clanId)

					if (!await app.itm.hasItems(clanItems, item, amount)) {
						return m.channel.createMessage(`❌ Their vault doesn't have enough of that item. They have **${clanItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\``)
					}

					await app.itm.removeItem(clanRow.clanId, item, amount)
					await app.itm.addItem(scoreRow.clanId, item, amount)

					m.channel.createMessage(`Successfully stole ${amount}x ${app.itemdata[item].icon}\`${item}\`.\n\nYou can steal **${itemsToSteal - (amount + itemsStolen)}** more items.`)
					itemsArray.push(`${item}|${amount}`)
					itemsStolen += amount

					if (itemsToSteal - itemsStolen <= 0) {
						m.channel.createMessage(`<@${m.author.id}>, -> Max items stolen. Ending raid.`)
						app.msgCollector.stopCollector(collectorObj)
					}
				}
			})
			collectorObj.collector.on('end', async reason => {
				await app.cd.clearCD(clanRow.clanId, 'getting_raided')

				const successEmbed = new app.Embed()
					.setAuthor(`${message.author.username} | ${raider.name}`, message.author.avatarURL)
					.setDescription(`Money Stolen: ${app.common.formatNumber(moneyStolen)}`)
					.addField('Items Stolen:', getItemsDisplay(app, itemsArray).join('\n'))
					.setColor(8311585)
					.setFooter('These items can be found in your clan vault.')

				message.channel.createMessage(successEmbed)

				app.clans.raidNotify(clanRow.clanId, raider.name, moneyStolen, getItemsDisplay(app, itemsArray))
			})
		}
		catch (err) {
			return message.reply('❌ You have an active command running!')
		}
	}
}

function getItemsDisplay(app, itemArr) {
	const nameArr = []
	const amountArr = []
	const finalArr = []

	for (let i = 0; i < itemArr.length; i++) {
		const item = itemArr[i].split('|')

		const nameArrIndex = nameArr.indexOf(item[0])

		if (nameArrIndex !== -1) {
			amountArr[nameArrIndex] = parseInt(amountArr[nameArrIndex]) + parseInt(item[1])
		}
		else {
			nameArr.push(item[0])
			amountArr.push(item[1])
		}
	}

	for (let i = 0; i < nameArr.length; i++) {
		finalArr.push(`${amountArr[i]}x ${app.itemdata[nameArr[i]].icon}\`${nameArr[i]}\``)
	}

	return finalArr.length > 0 ? finalArr : ['Nothing...']
}
