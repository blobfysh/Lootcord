const { reply } = require('./messageUtils')

const reward = 'locked_crate'

exports.init = function (app, channel, roleId = undefined, firstRun = false) {
	const countDown = firstRun ? 1000 * 60 * 20 : Math.round(Math.random() * (3600 * 1000)) + (7200 * 1000)

	console.log(`Starting locked crate event for ${channel.id} in ${app.cd.convertTime(countDown)}`)

	setTimeout(async () => {
		try {
			await start(app, channel, roleId)
		}
		catch (err) {
			console.warn(err)
		}
	}, countDown)
}

async function start (app, channel, roleId) {
	const code = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000

	const startedEmbed = new app.Embed()
		.setDescription(`**A ${app.itemdata[reward].icon}\`${reward}\` has arrived!**\n\nThe first person to guess the 4-digit code gets it!`)
		.setImage(app.itemdata[reward].image)
		.setColor('#ADADAD')
		.setFooter('You have 10 minutes to guess the code.')

	try {
		try {
			await channel.createMessage({
				content: roleId ? `<@&${roleId}>` : undefined,
				embed: startedEmbed.embed
			})
		}
		catch (err) {
			console.error(err)
		}

		console.log('[CODE CHALLENGE] Locked crate challenge started')

		const collectorObj = app.msgCollector.createChannelCollector(channel.id, m => m.content.length === 4 && !isNaN(m.content) && !isNaN(parseInt(m.content)), { time: 10 * 60 * 1000 })

		collectorObj.collector.on('collect', async m => {
			try {
				if (!await app.player.isActive(m.author.id, m.channel.guild.id)) {
					return reply(m, 'You must be active in this server to make guesses! Use the `activate` command to activate here.')
				}

				const guess = parseInt(m.content)

				if (guess === code) {
					app.msgCollector.stopCollector(collectorObj)

					const guildInfo = await app.common.getGuildInfo(m.channel.guild.id)

					if (guildInfo.serverOnly) {
						await app.itm.addItem(m.author.id, reward, 1, m.channel.guild.id)
					}
					else {
						await app.itm.addItem(m.author.id, reward, 1)
					}

					await reply(m, `<@${m.author.id}> CRACKED THE CODE AND TOOK THE ${app.itemdata[reward].icon}\`${reward}\``)
				}
				else if (guess < code) {
					await reply(m, `\`\`\`js\n❌ Error: Code is higher than ${m.content}\n  at guessCode (c:\\system\\notporn\\tools\\codebreak.exe:69:420)\`\`\``)
				}
				else if (guess > code) {
					await reply(m, `\`\`\`js\n❌ Error: Code is lower than ${m.content}\n  at guessCode (c:\\system\\notporn\\tools\\codebreak.exe:506:35)\`\`\``)
				}
			}
			catch (err) {
				console.warn(err)
			}
		})

		collectorObj.collector.on('end', async reason => {
			try {
				exports.init(app, channel, roleId)

				if (reason === 'time') {
					await channel.createMessage(`Nobody cracked the code! The code was **${code}**.`)
				}
			}
			catch (err) {
				console.warn(err)
			}
		})
	}
	catch (err) {
		// removed bot from guild?
		console.warn(err)
	}
}
