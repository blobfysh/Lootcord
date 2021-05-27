const { InteractionResponseType } = require('slash-commands')
const { getQuestion, idiotBadgeCheck, geniusBadgeCheck, getReward } = require('../../commands/rewards/trivia')
const { decode } = require('html-entities')

exports.command = {
	name: 'trivia',
	description: 'Answer a random question for a reward!',
	requiresAcc: true,
	requiresActive: true,
	options: [],

	async execute(app, interaction, { guildInfo, serverSideGuildId }) {
		const triviaCD = await app.cd.getCD(interaction.member.user.id, 'trivia', { serverSideGuildId })

		if (triviaCD) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `You just played a game of trivia! Please wait \`${triviaCD}\` before playing another.`
				}
			})
		}

		await app.cd.setCD(interaction.member.user.id, 'trivia', app.config.cooldowns.trivia * 1000, { serverSideGuildId })
		await app.player.addStat(interaction.member.user.id, 'trivias', 1, serverSideGuildId)

		const triviaStreak = await app.player.getStat(interaction.member.user.id, 'triviaStreak', serverSideGuildId)
		const { question, correct_answer, incorrect_answers } = await getQuestion()

		// combine correct answer and incorrect answers and shuffle them
		const [questionA, questionB, questionC, questionD] = app.common.shuffleArr([correct_answer, ...incorrect_answers])
		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(interaction.member.user.id, serverSideGuildId), await app.player.getRow(interaction.member.user.id, serverSideGuildId))
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		const reward = getReward(app, triviaStreak, hasEnough)

		const embedTrivia = new app.Embed()
			.setTitle(decode(question))
			.setColor(16777215)
			.setDescription(`🇦 ${decode(questionA)}\n🇧 ${decode(questionB)}\n🇨 ${decode(questionC)}\n🇩 ${decode(questionD)}`)
			.addField('Reward', `${reward.display}`, true)
			.addField('Trivia Streak', `${triviaStreak > 2 ? '🔥' : ''} **${triviaStreak}** in a row\nHigher streak = better reward`, true)
			.setFooter('You have 20 seconds to answer. Type A, B, C, or D to pick.')

		// initial response
		await interaction.respond({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [embedTrivia.embed]
			}
		})

		const collectorObj = app.msgCollector.createUserCollector(interaction.member.user.id, interaction.channelID, m => m.author.id === interaction.member.user.id && ['a', 'b', 'c', 'd'].includes(m.content.toLowerCase()), { time: 20000, maxMatches: 1 })

		collectorObj.collector.on('collect', async m => {
			const collected = m.content.toLowerCase()

			if (collected === 'a' && questionA === correct_answer) {
				triviaReward()
			}
			else if (collected === 'b' && questionB === correct_answer) {
				triviaReward()
			}
			else if (collected === 'c' && questionC === correct_answer) {
				triviaReward()
			}
			else if (collected === 'd' && questionD === correct_answer) {
				triviaReward()
			}
			else {
				const embedWrong = new app.Embed()
					.setTitle('Incorrect')
					.setColor(13632027)
					.addField('Reward:', '`shame`')

				// check if user recieves idiot badge
				idiotBadgeCheck(app, interaction.member.user.id, serverSideGuildId)
				// reset trivia streak
				app.player.resetStat(interaction.member.user.id, 'triviaStreak', serverSideGuildId)

				await interaction.followUp({
					embeds: [embedWrong.embed]
				})
			}

			async function triviaReward() {
				if (reward.item === 'money') {
					await app.player.addMoney(interaction.member.user.id, reward.amount, serverSideGuildId)
				}
				else {
					await app.itm.addItem(interaction.member.user.id, reward.item, reward.amount, serverSideGuildId)
				}

				await app.player.addStat(interaction.member.user.id, 'triviaStreak', 1, serverSideGuildId)
				await app.player.addStat(interaction.member.user.id, 'triviasCorrect', 1, serverSideGuildId)

				// check if user receives genius badge
				await geniusBadgeCheck(app, interaction.member.user.id, serverSideGuildId)

				const embedReward = new app.Embed()
					.setTitle(`${decode(correct_answer)} is correct!`)
					.setColor(720640)
					.addField('Reward:', reward.display)

				await interaction.followUp({
					embeds: [embedReward.embed]
				})
			}
		})

		collectorObj.collector.on('end', reason => {
			if (reason === 'time') {
				const errorEmbed = new app.Embed()
					.setColor(16734296)
					.setDescription('❌ You ran out of time!')

				// check if user receives idiot badge
				idiotBadgeCheck(app, interaction.member.user.id, serverSideGuildId)
				// reset trivia streak
				app.player.resetStat(interaction.member.user.id, 'triviaStreak', serverSideGuildId)

				interaction.followUp({
					embeds: [errorEmbed.embed]
				})
			}
		})
	}
}
