const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'jackpot',
	aliases: [],
	description: 'Start a jackpot prize pool that other users can enter for a chance to win it all!',
	long: 'Start a server jackpot that lasts 2 minutes! Other players can join the jackpot with the join command. The more you put into the pot, the higher your chance of winning it all.',
	args: { amount: 'Amount of scrap to gamble.' },
	examples: ['jackpot 1000'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const jackpotCD = await app.cd.getCD(message.author.id, 'jackpot', { serverSideGuildId })
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		let gambleAmount = app.parse.numbers(args)[0]

		if (!gambleAmount && args[0] && args[0].toLowerCase() === 'all') {
			gambleAmount = row.money >= 50000 ? 50000 : row.money
		}

		if (jackpotCD) {
			return reply(message, `You recently started a server jackpot! You can create another in \`${jackpotCD}\`.`)
		}

		if (!gambleAmount || gambleAmount < 100) {
			return reply(message, `Please specify an amount of at least ${app.common.formatNumber(100)} to gamble!`)
		}

		if (gambleAmount > row.money) {
			return reply(message, `❌ You don't have that much scrap! You currently have **${app.common.formatNumber(row.money)}**.`)
		}

		if (gambleAmount > 50000) {
			return reply(message, `Woah there high roller, you cannot gamble more than ${app.common.formatNumber(50000)} on jackpot.`)
		}

		const botMessage = await reply(message, {
			content: `You are about to start a server jackpot with an entry of: ${app.common.formatNumber(gambleAmount)}\nAre you sure?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]
			const verifyRow = await app.player.getRow(message.author.id, serverSideGuildId)

			if (confirmed.customID === 'confirmed' && gambleAmount <= verifyRow.money) {
				await confirmed.respond({
					content: '**A jackpot has started!** A winner will be chosen in `2 minutes`.',
					components: []
				})

				startJackpot(app, message, prefix, gambleAmount, serverSideGuildId)
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}

async function startJackpot (app, message, prefix, gambleAmount, serverSideGuildId) {
	const jackpotObj = {}

	try {
		if (app.msgCollector.channelCollectors.filter(obj => obj.channelId === message.channel.id).length) throw new Error('Jackpot already started!')

		const collectorObj = app.msgCollector.createChannelCollector(message.channel.id, m => m.content.toLowerCase().startsWith(`${prefix}join`), { time: 120000 })

		jackpotObj[message.author.id] = { name: message.author.username, amount: gambleAmount }
		message.channel.createMessage(refreshEmbed(app, jackpotObj, prefix))

		await app.player.removeMoney(message.author.id, gambleAmount, serverSideGuildId)
		await app.cd.setCD(message.author.id, 'jackpot', app.config.cooldowns.jackpot * 1000, { serverSideGuildId })

		setTimeout(() => {
			message.channel.createMessage(`⏱ **\`1 minute\` remaining to enter the jackpot! Use \`${prefix}join <amount>\` to enter!**`)
		}, 60000)

		setTimeout(() => {
			message.channel.createMessage(`⏱ **\`30 seconds\` remaining to enter the jackpot! Use \`${prefix}join <amount>\` to enter!**`)
		}, 90000)

		setTimeout(() => {
			message.channel.createMessage('⏱ **Jackpot ends in... 10**')
		}, 110000)

		setTimeout(() => {
			message.channel.createMessage('⏱ **Jackpot ends in... 5**')
		}, 115000)

		setTimeout(() => {
			message.channel.createMessage('And the winner is...')
		}, 119000)

		collectorObj.collector.on('collect', async m => {
			if (!await app.player.isActive(m.author.id, m.channel.guild.id)) return m.channel.createMessage(`Your account is not active in this server! Use \`${prefix}play\` to activate it here`)
			const userArgs = m.content.slice(prefix.length).split(/ +/).slice(1)
			const userRow = await app.player.getRow(m.author.id, serverSideGuildId)
			let gambleAmnt = app.parse.numbers(userArgs)[0]

			if (!userRow) {
				// in case server-side economy gets disabled mid-jackpot, user might have global account but not server-side account
				return
			}
			else if (!gambleAmnt && userArgs[0] && userArgs[0].toLowerCase() === 'all') {
				gambleAmnt = userRow.money >= 50000 ? 50000 : userRow.money
			}

			if (Object.keys(jackpotObj).length >= 15) {
				return m.channel.createMessage('Sorry, this jackpot is full!')
			}
			else if (!gambleAmnt || gambleAmnt < 100) {
				return m.channel.createMessage(`Please enter an amount of at least ${app.common.formatNumber(100)}`)
			}
			else if (gambleAmnt > userRow.money) {
				return m.channel.createMessage(`❌ You don't have that much scrap! You currently have ${app.common.formatNumber(userRow.money)}`)
			}
			else if (gambleAmnt > 50000) {
				return m.channel.createMessage(`❌ You cannot enter more than ${app.common.formatNumber(50000)}!`)
			}
			else if (jackpotObj.hasOwnProperty(m.author.id) && (gambleAmnt + jackpotObj[m.author.id].amount) > 50000) {
				return m.channel.createMessage(`❌ Adding ${app.common.formatNumber(gambleAmnt)} would put your entry over the ${app.common.formatNumber(50000)} entry limit!`)
			}

			if (jackpotObj.hasOwnProperty(m.author.id)) {
				jackpotObj[m.author.id] = {
					name: m.author.username,
					amount: gambleAmnt + jackpotObj[m.author.id].amount
				}
			}
			else {
				jackpotObj[m.author.id] = {
					name: m.author.username,
					amount: gambleAmnt
				}
			}

			await app.player.removeMoney(m.author.id, gambleAmnt, serverSideGuildId)
			m.channel.createMessage(refreshEmbed(app, jackpotObj, prefix))
		})

		collectorObj.collector.on('end', async reason => {
			const winnerId = pickWinner(jackpotObj)
			const winAmount = getJackpotTotal(jackpotObj)

			await app.player.addMoney(winnerId, winAmount, serverSideGuildId)

			message.channel.createMessage(`**${jackpotObj[winnerId].name}** won the ${app.common.formatNumber(winAmount)} jackpot with a ${(jackpotObj[winnerId].amount / getJackpotTotal(jackpotObj) * 100).toFixed(1)}% chance of winning!`)
		})
	}
	catch (err) {
		return reply(message, 'There is already an active jackpot in this channel.')
	}
}

function refreshEmbed (app, jackpotObj, prefix) {
	const usersArr = []
	const usersChances = []

	Object.keys(jackpotObj).forEach(user => {
		usersArr.push(`${jackpotObj[user].name.slice(0, 18).padEnd(20) + app.common.formatNumber(jackpotObj[user].amount, true).padEnd(15) + ((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1)}%`)

		usersChances.push(((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1))
	})

	// usersChances.sort(function(a, b){return b - a});
	usersArr.sort((a, b) => parseFloat(b.substr(-5, b.indexOf('%')).substr(0, 4)) - parseFloat(a.substr(-5, a.indexOf('%')).substr(0, 4)))

	for (let i = 0; i < usersArr.length; i++) {
		usersArr[i] = `${i + 1}.${usersArr[i]}`
	}

	usersArr.unshift(`${'Player'.padEnd(22) + 'Bet'.padEnd(15)}Chance`)

	const jackpotEmbed = new app.Embed()
		.setColor(13451564)
		.setTitle('Jackpot - Win it all!')
		.setDescription(`Enter or add to your current bet with \`${prefix}join <amount>\`.`)
		.addField('Current entrants', `\`\`\`\n${usersArr.join('\n')}\`\`\``)
		.addField('Prize pool', app.common.formatNumber(getJackpotTotal(jackpotObj)))
	return jackpotEmbed
}

function getJackpotTotal (jackpotObj) {
	let total = 0
	Object.keys(jackpotObj).forEach(user => {
		total += jackpotObj[user].amount
	})

	return total
}

function pickWinner (jackpotObj) {
	const entrants = [] // add the entrants userid's to this array x amount of times based on their win chance

	Object.keys(jackpotObj).forEach(user => {
		let amountToAdd = 0

		amountToAdd = Math.floor(((jackpotObj[user].amount / getJackpotTotal(jackpotObj)) * 100).toFixed(1))

		for (let i = 0; i < amountToAdd; i++) {
			entrants.push(user)
		}
	})

	return entrants[Math.floor(Math.random() * entrants.length)]
}
