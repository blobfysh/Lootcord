const { getQuestion, idiotBadgeCheck, geniusBadgeCheck, getReward, getChoice } = require('../../commands/rewards/trivia')
const { decode } = require('html-entities')

exports.command = {
	name: 'trivia',
	description: 'Answer a random question for a reward!',
	requiresAcc: true,
	requiresActive: true,
	options: [],

	async execute (app, interaction, { guildInfo, serverSideGuildId }) {
		const triviaCD = await app.cd.getCD(interaction.member.user.id, 'trivia', { serverSideGuildId })

		if (triviaCD) {
			return interaction.respond({
				content: `You just played a game of trivia! Please wait \`${triviaCD}\` before playing another.`
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'trivia', app.config.cooldowns.trivia * 1000, { serverSideGuildId })
		await app.player.addStat(interaction.member.user.id, 'trivias', 1, serverSideGuildId)

		const triviaStreak = await app.player.getStat(interaction.member.user.id, 'triviaStreak', serverSideGuildId)
		const { question, correct_answer, incorrect_answers } = await getQuestion()

		// combine correct answer and incorrect answers and shuffle them
		const choices = app.common.shuffleArr([correct_answer, ...incorrect_answers])
		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(interaction.member.user.id, serverSideGuildId), await app.player.getRow(interaction.member.user.id, serverSideGuildId))
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		const reward = getReward(app, triviaStreak, hasEnough)

		const embedTrivia = new app.Embed()
			.setTitle(decode(question))
			.setColor(16777215)
			.setDescription(`**A**: ${decode(choices[0])}\n**B**: ${decode(choices[1])}\n**C**: ${decode(choices[2])}\n**D**: ${decode(choices[3])}`)
			.addField('Reward', `${reward.display}`, true)
			.addField('Trivia Streak', `${triviaStreak > 2 ? '🔥' : ''} **${triviaStreak}** in a row\nHigher streak = better reward`, true)
			.setFooter('You have 20 seconds to answer. Type A, B, C, or D to pick.')

		// initial response
		const botMessage = await interaction.respond({
			embeds: [embedTrivia.embed],
			components: [{
				type: 1,
				components: [
					{
						type: 2,
						label: 'A',
						custom_id: 'a',
						style: 2
					},
					{
						type: 2,
						label: 'B',
						custom_id: 'b',
						style: 2
					},
					{
						type: 2,
						label: 'C',
						custom_id: 'c',
						style: 2
					},
					{
						type: 2,
						label: 'D',
						custom_id: 'd',
						style: 2
					}
				]
			}]
		})

		try {
			const collected = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === interaction.user.id, { time: 20000 }))[0]
			const choice = getChoice(collected.customID, choices)

			if (choice === correct_answer) {
				if (reward.item === 'money') {
					await app.player.addMoney(interaction.user.id, reward.amount, serverSideGuildId)
				}
				else {
					await app.itm.addItem(interaction.user.id, reward.item, reward.amount, serverSideGuildId)
				}

				await app.player.addStat(interaction.user.id, 'triviaStreak', 1, serverSideGuildId)
				await app.player.addStat(interaction.user.id, 'triviasCorrect', 1, serverSideGuildId)

				// check if user receives genius badge
				await geniusBadgeCheck(app, interaction.user.id, serverSideGuildId)

				const embedReward = new app.Embed()
					.setDescription(`**${decode(correct_answer)}** is correct!`)
					.setColor(720640)
					.addField('Reward:', reward.display)

				await collected.respond({
					embeds: [embedReward.embed],
					components: []
				})
			}
			else {
				const embedWrong = new app.Embed()
					.setDescription(`**${decode(choice)}** is not correct`)
					.setColor(16734296)
					.addField('Reward:', '`shame`')

				// check if user recieves idiot badge
				await idiotBadgeCheck(app, interaction.user.id, serverSideGuildId)
				// reset trivia streak
				await app.player.resetStat(interaction.user.id, 'triviaStreak', serverSideGuildId)

				await collected.respond({
					embeds: [embedWrong.embed],
					components: []
				})
			}
		}
		catch (err) {
			const errorEmbed = new app.Embed()
				.setColor(16734296)
				.setDescription('❌ You ran out of time!')

			// check if user receives idiot badge
			await idiotBadgeCheck(app, interaction.user.id, serverSideGuildId)
			// reset trivia streak
			await app.player.resetStat(interaction.user.id, 'triviaStreak', serverSideGuildId)

			await interaction.editResponse({
				embeds: [errorEmbed.embed],
				components: []
			})
		}
	}
}
