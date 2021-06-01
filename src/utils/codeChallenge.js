const { reply } = require('./messageUtils')

const reward = 'locked_crate'

exports.init = function (app, channel) {
	setTimeout(async () => {
		try {
			await start(app, channel)
		}
		catch (err) {
			console.warn(err)
		}
	}, Math.round(Math.random() * (3600 * 1000)) + (3600 * 1000))
}

async function start (app, channel) {
	const code = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000

	const startedEmbed = new app.Embed()
		.setDescription(`**A ${app.itemdata[reward].icon}\`${reward}\` has arrived!**\n\nThe first person to guess the 4-digit code gets it!`)
		.setImage(app.itemdata[reward].image)
		.setColor(13451564)
		.setFooter('You have 10 minutes to guess the code.')

	await channel.createMessage(startedEmbed)

	const collectorObj = app.msgCollector.createChannelCollector(channel.id, m => m.content.length === 4 && !isNaN(m.content) && !isNaN(parseInt(m.content)), { time: 10 * 60 * 1000 })

	collectorObj.collector.on('collect', async m => {
		try {
			if (!await app.player.isActive(m.author.id, m.channel.guild.id)) {
				return reply(m, 'You must be active in this server to make guesses! Use the `activate` command to activate here.')
			}

			const guess = parseInt(m.content)

			if (guess === code) {
				app.msgCollector.stopCollector(collectorObj)

				await app.itm.addItem(m.author.id, reward, 1)
				await app.itm.addItem(m.author.id, reward, 1, m.channel.guild.id)

				await reply(m, `<@${m.author.id}> CRACKED THE CODE AND TOOK THE ${app.itemdata[reward].icon}\`${reward}\``)
			}
			else if (guess < code) {
				await reply(m, '```js\n❌ Error: Code is a higher number\n  at guessCode (c:\\system\\notporn\\tools\\codebreak.exe:69:420)```')
			}
			else if (guess > code) {
				await reply(m, '```js\n❌ Error: Code is a lower number\n  at guessCode (c:\\system\\notporn\\tools\\codebreak.exe:506:35)```')
			}
		}
		catch (err) {
			console.warn(err)
		}
	})

	collectorObj.collector.on('end', async reason => {
		try {
			exports.init(app, channel)

			if (reason === 'time') {
				await channel.createMessage(`Nobody cracked the code! The code was **${code}**.`)
			}
		}
		catch (err) {
			console.warn(err)
		}
	})
}
