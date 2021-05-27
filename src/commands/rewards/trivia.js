const axios = require('axios')
const { decode } = require('html-entities')
let triviaFile

try {
	triviaFile = require('../../resources/json/trivia_questions.json')
}
catch (err) {
	triviaFile = require('../../resources/json/trivia_questions_example.json')
}

exports.command = {
	name: 'trivia',
	aliases: [],
	description: 'Answer a random question for a reward!',
	long: 'Answer a random trivia question for a reward! Submit your own questions for the trivia command [here](https://opentdb.com/)!',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const triviaCD = await app.cd.getCD(message.author.id, 'trivia', { serverSideGuildId })

		if (triviaCD) {
			return message.reply(`You just played a game of trivia! Please wait \`${triviaCD}\` before playing another.`)
		}

		await app.cd.setCD(message.author.id, 'trivia', app.config.cooldowns.trivia * 1000, { serverSideGuildId })
		await app.player.addStat(message.author.id, 'trivias', 1, serverSideGuildId)

		const triviaStreak = await app.player.getStat(message.author.id, 'triviaStreak', serverSideGuildId)
		const { question, correct_answer, incorrect_answers } = await getQuestion()

		// combine correct answer and incorrect answers and shuffle them
		const [questionA, questionB, questionC, questionD] = app.common.shuffleArr([correct_answer, ...incorrect_answers])
		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), await app.player.getRow(message.author.id, serverSideGuildId))
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		const reward = getReward(app, triviaStreak, hasEnough)

		const embedTrivia = new app.Embed()
			.setTitle(decode(question))
			.setColor(16777215)
			.setDescription(`🇦 ${decode(questionA)}\n🇧 ${decode(questionB)}\n🇨 ${decode(questionC)}\n🇩 ${decode(questionD)}`)
			.addField('Reward', `${reward.display}`, true)
			.addField('Trivia Streak', `${triviaStreak > 2 ? '🔥' : ''} **${triviaStreak}** in a row\nHigher streak = better reward`, true)
			.setFooter('You have 20 seconds to answer. Type A, B, C, or D to pick.')
		await message.channel.createMessage(embedTrivia)

		const collectorObj = app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => m.author.id === message.author.id && ['a', 'b', 'c', 'd'].includes(m.content.toLowerCase()), { time: 20000, maxMatches: 1 })

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
				idiotBadgeCheck(app, message.author.id, serverSideGuildId)
				// reset trivia streak
				app.player.resetStat(message.author.id, 'triviaStreak', serverSideGuildId)

				m.reply(embedWrong)
			}

			async function triviaReward () {
				if (reward.item === 'money') {
					await app.player.addMoney(message.author.id, reward.amount, serverSideGuildId)
				}
				else {
					await app.itm.addItem(message.author.id, reward.item, reward.amount, serverSideGuildId)
				}

				await app.player.addStat(message.author.id, 'triviaStreak', 1, serverSideGuildId)
				await app.player.addStat(message.author.id, 'triviasCorrect', 1, serverSideGuildId)

				// check if user receives genius badge
				await geniusBadgeCheck(app, message.author.id, serverSideGuildId)

				const embedReward = new app.Embed()
					.setTitle(`${decode(correct_answer)} is correct!`)
					.setColor(720640)
					.addField('Reward:', reward.display)
				m.reply(embedReward)
			}
		})

		collectorObj.collector.on('end', reason => {
			if (reason === 'time') {
				const errorEmbed = new app.Embed()
					.setColor(16734296)
					.setDescription('❌ You ran out of time!')

				// check if user receives idiot badge
				idiotBadgeCheck(app, message.author.id, serverSideGuildId)
				// reset trivia streak
				app.player.resetStat(message.author.id, 'triviaStreak', serverSideGuildId)

				message.reply(errorEmbed)
			}
		})
	}
}

const idiotBadgeCheck = exports.idiotBadgeCheck = async function idiotBadgeCheck (app, userId, serverSideGuildId) {
	const correct = await app.player.getStat(userId, 'triviasCorrect', serverSideGuildId)
	const attempts = await app.player.getStat(userId, 'trivias', serverSideGuildId)

	if (attempts - correct >= 200) {
		await app.itm.addBadge(userId, 'idiot', serverSideGuildId)
	}
}

const geniusBadgeCheck = exports.geniusBadgeCheck = async function geniusBadgeCheck (app, userId, serverSideGuildId) {
	if (await app.player.getStat(userId, 'triviasCorrect', serverSideGuildId) >= 100) {
		await app.itm.addBadge(userId, 'genius', serverSideGuildId)
	}
}

const getQuestion = exports.getQuestion = async function getQuestion () {
	try {
		const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', {
			timeout: 3000
		})

		if (res.status !== 200 || (res.data && res.data.response_code !== 0)) {
			throw new Error('Failed to fetch trivia')
		}

		return res.data.results[0]
	}
	catch (err) {
		// use local trivia file
		return triviaFile[Math.floor(Math.random() * triviaFile.length)]
	}
}

const getReward = exports.getReward = function getReward (app, streak, hasSpace) {
	const reward = {
		display: '',
		item: '',
		amount: 1
	}

	if (streak <= 2) {
		reward.item = 'crate'
		reward.display = `${app.itemdata.crate.icon}\`crate\``
	}
	else if (streak <= 7) {
		reward.item = 'military_crate'
		reward.display = `${app.itemdata.military_crate.icon}\`military_crate\``
	}
	else if (streak % 10 === 0) {
		reward.item = 'elite_crate'
		reward.display = `${app.itemdata.elite_crate.icon}\`elite_crate\``
	}
	else {
		reward.item = 'supply_drop'
		reward.display = `${app.itemdata.supply_drop.icon}\`supply_drop\``
	}

	if (!hasSpace) {
		let prize = Math.round(app.itemdata[reward.item].sell / 1000) * 1000

		if (prize < 1000) {
			prize = 1000
		}

		reward.item = 'money'
		reward.amount = prize
		reward.display = app.common.formatNumber(prize)
	}

	return reward
}
