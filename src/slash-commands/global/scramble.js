const { ApplicationCommandOptionType } = require('slash-commands')
const { getWord, shuffleWordNoDupe } = require('../../commands/rewards/scramble')

exports.command = {
	name: 'scramble',
	description: 'Unscramble a random word for a reward.',
	requiresAcc: true,
	requiresActive: true,
	options: [
		{
			type: ApplicationCommandOptionType.STRING,
			name: 'difficulty',
			description: 'Easy - hint but less reward, or hard - better reward, no hint',
			required: true,
			choices: [
				{
					name: 'easy',
					value: 'easy'
				},
				{
					name: 'hard',
					value: 'hard'
				}
			]
		}
	],

	async execute (app, interaction, { guildInfo, serverSideGuildId }) {
		const scrambleCD = await app.cd.getCD(interaction.member.user.id, 'scramble', { serverSideGuildId })

		if (scrambleCD) {
			return interaction.respond({
				content: `You need to wait \`${scrambleCD}\` before playing another game of scramble.`
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'scramble', app.config.cooldowns.scramble * 1000, { serverSideGuildId })
		await app.player.addStat(interaction.member.user.id, 'scrambles', 1, serverSideGuildId)

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(interaction.member.user.id, serverSideGuildId), await app.player.getRow(interaction.member.user.id, serverSideGuildId))
		const { word, rhymesWith, difficulty, definition } = await getWord()
		const option = interaction.data.options[0].value
		const reward = {}
		let scrambleHint = definition

		if (Math.random() <= 0.7) {
			scrambleHint = `Rhymes with ${rhymesWith.map(rhyme => `\`${rhyme}\``)}.`
		}

		const embedScramble = new app.Embed()
			.setFooter('You have 15 seconds to unscramble this word.')

		if (option === 'easy') {
			embedScramble.setDescription(`**Hint:** ${scrambleHint}\nWord: \`\`\`fix\n${shuffleWordNoDupe(word)}\`\`\``)
			if (difficulty === 'hard') {
				const hasEnough = await app.itm.hasSpace(itemCt, 1)

				if (hasEnough) {
					reward.display = `${app.itemdata.crate.icon}\`crate\``
					reward.item = 'crate'
					reward.amount = 1
				}
				else {
					reward.display = app.common.formatNumber(2750)
					reward.item = 'money'
					reward.amount = 2750
				}
			}
			else if (difficulty === 'medium') {
				const hasEnough = await app.itm.hasSpace(itemCt, 1)

				if (hasEnough) {
					reward.display = `${app.itemdata.crate.icon}\`crate\``
					reward.item = 'crate'
					reward.amount = 1
				}
				else {
					reward.display = app.common.formatNumber(1950)
					reward.item = 'money'
					reward.amount = 1950
				}
			}
			else {
				const hasEnough = await app.itm.hasSpace(itemCt, 1)

				if (hasEnough) {
					reward.display = `${app.itemdata.crate.icon}\`crate\``
					reward.item = 'crate'
					reward.amount = 1
				}
				else {
					reward.display = app.common.formatNumber(1700)
					reward.item = 'money'
					reward.amount = 1700
				}
			}
		}
		else if (option === 'hard') {
			embedScramble.setDescription(`Word: \`\`\`fix\n${shuffleWordNoDupe(word.toLowerCase())}\`\`\``)

			if (difficulty === 'hard') {
				const hasEnough = await app.itm.hasSpace(itemCt, 1)

				if (hasEnough) {
					reward.display = `${app.itemdata.military_crate.icon}\`military_crate\``
					reward.item = 'military_crate'
					reward.amount = 1
				}
				else {
					reward.display = app.common.formatNumber(8500)
					reward.item = 'money'
					reward.amount = 8500
				}
			}
			else if (difficulty === 'medium') {
				const hasEnough = await app.itm.hasSpace(itemCt, 1)

				if (hasEnough) {
					reward.display = `1x ${app.itemdata.crate.icon}\`crate\``
					reward.item = 'crate'
					reward.amount = 1
				}
				else {
					reward.display = app.common.formatNumber(4600)
					reward.item = 'money'
					reward.amount = 4600
				}
			}
			else {
				const hasEnough = await app.itm.hasSpace(itemCt, 1)

				if (hasEnough) {
					reward.display = `1x ${app.itemdata.crate.icon}\`crate\``
					reward.item = 'crate'
					reward.amount = 1
				}
				else {
					reward.display = app.common.formatNumber(3750)
					reward.item = 'money'
					reward.amount = 3750
				}
			}
		}

		embedScramble.addField('Reward', reward.display)

		if (difficulty === 'hard') {
			embedScramble.setColor(16734296)
		}
		else if (difficulty === 'medium') {
			embedScramble.setColor(15531864)
		}
		else {
			embedScramble.setColor(9043800)
		}

		const collectorObj = app.msgCollector.createUserCollector(interaction.member.user.id, interaction.channelID, m => m.author.id === interaction.member.user.id, { time: 15000 })

		await interaction.respond({
			embeds: [embedScramble.embed]
		})

		collectorObj.collector.on('collect', async m => {
			if (m.content.toLowerCase() === word.toLowerCase()) {
				app.msgCollector.stopCollector(collectorObj)

				if (reward.item === 'money') {
					await app.player.addMoney(interaction.member.user.id, reward.amount, serverSideGuildId)
				}
				else {
					await app.itm.addItem(interaction.member.user.id, reward.item, reward.amount, serverSideGuildId)
				}

				await app.player.addStat(interaction.member.user.id, 'scramblesCorrect', 1, serverSideGuildId)

				const winScramble = new app.Embed()
					.setTitle('You got it correct!')
					.addField('Reward', reward.display)
					.setColor(9043800)

				await interaction.followUp({
					embeds: [winScramble.embed]
				})
			}
		})

		collectorObj.collector.on('end', reason => {
			if (reason === 'time') {
				const lostScramble = new app.Embed()
					.setTitle('You didn\'t get it in time!')
					.setDescription(`The word was: \`\`\`\n${word}\`\`\``)
					.setColor(16734296)

				interaction.followUp({
					embeds: [lostScramble.embed]
				})
			}
		})
	}
}
