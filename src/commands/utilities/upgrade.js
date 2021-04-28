const upgrOptions = ['health', 'strength', 'luck']

exports.command = {
	name: 'upgrade',
	aliases: [],
	description: 'Upgrade your skills!',
	long: 'Allows user to upgrade skills. Skills include Health, Strength, and Luck.\nHealth - Increases max health.\nStrength - Increases damage multiplier.\nLuck - Better loot drops and chance to dodge attacks.',
	args: { skill: '**OPTIONAL** Will upgrade selected skill when command is called', amount: '**OPTIONAL** Will upgrade selected skill x amount of times.' },
	examples: ['upgrade strength 2'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const upgrOpt = args[0] !== undefined ? args[0].toLowerCase() : ''
		const upgrAmnt = upgrOptions.includes(upgrOpt) ? app.parse.numbers(args)[0] || 1 : 1

		if (row.used_stats + upgrAmnt > 30) {
			return message.reply(`❌ Upgrading that much would put you over the max (30 skills upgraded, you've upgraded \`${row.used_stats}\` times). You can use a \`reroll_scroll\` to reset your skills.`)
		}

		let type = getType(upgrOpt)
		const price = getPrice(row.used_stats, upgrAmnt)

		if (upgrOptions.includes(upgrOpt)) {
			const botMessage = await message.reply(`Purchase ${upgrAmnt}x points of ${type.display} (${row[type.row]} → ${nextLevel(type, row, upgrAmnt)}) for ${app.common.formatNumber(price)}?`)

			try {
				const confirmed = await app.react.getConfirmation(message.author.id, botMessage)

				if (confirmed) {
					const vRow = await app.player.getRow(message.author.id, serverSideGuildId)

					if (vRow.money < price) {
						botMessage.edit(`You don't have enough money! You currently have ${app.common.formatNumber(row.money)}`)
					}
					else if (row.used_stats !== vRow.used_stats) {
						botMessage.edit('❌ Error: did your stats change while upgrading?')
					}
					else if (row.used_stats + upgrAmnt > 30) {
						botMessage.edit('❌ Upgrading that much would put you over the max (30 skills upgraded). You can use a `reroll_scroll` to reset your skills.')
					}
					else {
						await incrUsedStats(app, message.author.id, upgrAmnt, serverSideGuildId)
						await app.player.removeMoney(message.author.id, price, serverSideGuildId)
						await purchaseSkills(app, message, type.title, upgrAmnt, serverSideGuildId)

						botMessage.edit(`Successfully allocated ${upgrAmnt} points to ${type.display}.`)
					}
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				botMessage.edit('You didn\'t react in time!')
			}
		}
		else {
			const skillEmbed = new app.Embed()
				.setColor(1)
				.setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
				.setTitle('Choose a skill to upgrade')
				.setDescription(`Cost to upgrade: ${app.common.formatNumber(price)}`)
				.addField('💗 Health', `Increases max health by 5 (\`${row.maxHealth} HP\` →\`${row.maxHealth + 5} HP\`)`)
				.addField('💥 Strength', `Increases damage by 3% (\`${row.scaledDamage.toFixed(2)}x\` → \`${(row.scaledDamage + 0.03).toFixed(2)}x\`)`)
				.addField('🍀 Luck', `Increases luck by 2 (\`${row.luck}\` → \`${row.luck + 2}\`)`)
				.setFooter('The cost to upgrade skills doubles after each purchase. You can reset skills with a reroll_scroll')

			const botMessage = await message.channel.createMessage(skillEmbed)

			try {
				const collected = await app.react.getFirstReaction(message.author.id, botMessage, 15000, ['💗', '💥', '🍀', '❌'])
				const vRow = await app.player.getRow(message.author.id, serverSideGuildId)

				if (collected === '💗') {
					type = getType('health')

					if (vRow.money < price) {
						const errorEmbed = new app.Embed()
							.setColor(16734296)
							.setDescription(`❌ You don't have enough money! You currently have ${app.common.formatNumber(vRow.money)}`)
						botMessage.edit(errorEmbed)
					}
					else if (row.used_stats !== vRow.used_stats) {
						const errorEmbed = new app.Embed()
							.setColor(16734296)
							.setDescription('❌ Error: did your stats change while upgrading?')
						botMessage.edit(errorEmbed)
					}
					else {
						await incrUsedStats(app, message.author.id, upgrAmnt, serverSideGuildId)
						await app.player.removeMoney(message.author.id, price, serverSideGuildId)
						await purchaseSkills(app, message, type.title, upgrAmnt, serverSideGuildId)


						const upgradedEmbed = new app.Embed()
							.setColor(14634070)
							.setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
							.setTitle(`Successfully allocated ${upgrAmnt} points to 💗 Health!`)
							.setDescription(`You now have ${row.maxHealth + 5} max health.`)
							.setFooter(`Total upgrades: ${row.used_stats + 1}`)
						botMessage.edit(upgradedEmbed)
					}
				}
				else if (collected === '💥') {
					type = getType('strength')

					if (vRow.money < price) {
						const errorEmbed = new app.Embed()
							.setColor(16734296)
							.setDescription(`❌ You don't have enough money! You currently have ${app.common.formatNumber(vRow.money)}`)
						botMessage.edit(errorEmbed)
					}
					else if (row.used_stats !== vRow.used_stats) {
						const errorEmbed = new app.Embed()
							.setColor(16734296)
							.setDescription('❌ Error: did your stats change while upgrading?')
						botMessage.edit(errorEmbed)
					}
					else {
						await incrUsedStats(app, message.author.id, upgrAmnt, serverSideGuildId)
						await app.player.removeMoney(message.author.id, price, serverSideGuildId)
						await purchaseSkills(app, message, type.title, upgrAmnt, serverSideGuildId)


						const upgradedEmbed = new app.Embed()
							.setColor(10036247)
							.setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
							.setTitle(`Successfully allocated ${upgrAmnt} points to 💥 Strength!`)
							.setDescription(`You now deal ${(row.scaledDamage + 0.03).toFixed(2)}x damage.`)
							.setFooter(`Total upgrades: ${row.used_stats + 1}`)

						botMessage.edit(upgradedEmbed)
					}
				}
				else if (collected === '🍀') {
					type = getType('luck')

					if (vRow.money < price) {
						const errorEmbed = new app.Embed()
							.setColor(16734296)
							.setDescription(`❌ You don't have enough money! You currently have ${app.common.formatNumber(vRow.money)}`)
						botMessage.edit(errorEmbed)
					}
					else if (row.used_stats !== vRow.used_stats) {
						const errorEmbed = new app.Embed()
							.setColor(16734296)
							.setDescription('❌ Error: did your stats change while upgrading?')
						botMessage.edit(errorEmbed)
					}
					else {
						await incrUsedStats(app, message.author.id, upgrAmnt, serverSideGuildId)
						await app.player.removeMoney(message.author.id, price, serverSideGuildId)
						await purchaseSkills(app, message, type.title, upgrAmnt, serverSideGuildId)


						const upgradedEmbed = new app.Embed()
							.setColor(5868887)
							.setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
							.setTitle(`Successfully allocated ${upgrAmnt} points to 🍀 Luck!`)
							.setDescription('**Luck increased by 2**\nYour chance to get rare items has been increased.')
							.setFooter(`Total upgrades: ${row.used_stats + 1}`)

						botMessage.edit(upgradedEmbed)
					}
				}
				else {
					botMessage.delete()
				}
			}
			catch (err) {
				const errorEmbed = new app.Embed()
					.setColor(16734296)
					.setDescription('❌ Command timed out')
				botMessage.edit(errorEmbed)
			}
		}
	}
}

async function incrUsedStats(app, userId, amount, serverSideGuildId = undefined) {
	if (serverSideGuildId) {
		await app.query(`UPDATE server_scores SET used_stats = used_stats + ${amount} WHERE userId = "${userId}" AND guildId = "${serverSideGuildId}"`)
	}
	else {
		await app.query(`UPDATE scores SET used_stats = used_stats + ${amount} WHERE userId = "${userId}"`)
	}
}

async function purchaseSkills(app, message, type, amount, serverSideGuildId = undefined) {
	if (type === 'Health' && serverSideGuildId) {
		await app.query(`UPDATE server_scores SET maxHealth = maxHealth + ${5 * amount} WHERE userId = "${message.author.id}" AND guildId = "${serverSideGuildId}"`)
	}
	else if (type === 'Health') {
		await app.query(`UPDATE scores SET maxHealth = maxHealth + ${5 * amount} WHERE userId = "${message.author.id}"`)
	}
	else if (type === 'Strength' && serverSideGuildId) {
		await app.query(`UPDATE server_scores SET scaledDamage = scaledDamage + ${(0.03 * amount).toFixed(2)} WHERE userId = "${message.author.id}" AND guildId = "${serverSideGuildId}"`)
	}
	else if (type === 'Strength') {
		await app.query(`UPDATE scores SET scaledDamage = scaledDamage + ${(0.03 * amount).toFixed(2)} WHERE userId = "${message.author.id}"`)
	}
	else if (serverSideGuildId) {
		// server-side luck
		await app.query(`UPDATE server_scores SET luck = luck + ${2 * amount} WHERE userId = "${message.author.id}" AND guildId = "${serverSideGuildId}"`)
	}
	else {
		// luck
		await app.query(`UPDATE scores SET luck = luck + ${2 * amount} WHERE userId = "${message.author.id}"`)
	}
}

function getType(type) {
	if (type === 'health') {
		return {
			title: 'Health',
			display: '💗 Health',
			row: 'maxHealth'
		}
	}
	else if (type === 'strength') {
		return {
			title: 'Strength',
			display: '💥 Strength',
			row: 'scaledDamage'
		}
	}
	else if (type === 'luck') {
		return {
			title: 'Luck',
			display: '🍀 Luck',
			row: 'luck'
		}
	}
	return ''
}

function nextLevel(type, row, amount) {
	if (type.title === 'Health') {
		return row[type.row] + (5 * amount)
	}
	else if (type.title === 'Strength') {
		return `${(row[type.row] + (0.03 * amount)).toFixed(2)}x`
	}
	else if (type.title === 'Luck') {
		return row[type.row] + (2 * amount)
	}
}

function getPrice(used_stats, amount) {
	let total_price = 0
	let initial_start = used_stats

	for (let i = 0; i < amount; i++) {
		total_price += Math.floor((2 ** initial_start) * 2500)

		initial_start += 1
	}

	return total_price
}
