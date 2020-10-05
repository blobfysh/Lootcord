module.exports = {
	name: 'vote',
	aliases: [''],
	description: 'Vote for the bot to collect a reward!',
	long: 'Vote for the bot to receive a reward.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message) {
		const voteCD = await app.cd.getCD(message.author.id, 'vote')
		const vote2CD = await app.cd.getCD(message.author.id, 'vote2')

		message.reply(getVotesAvailable(voteCD, vote2CD))
	}
}

function getVotesAvailable(vote1CD, vote2CD) {
	let str = '🎟 Vote for the bot to collect a reward!'

	if (vote1CD) str += `\n\n**Top.gg**: \`${vote1CD}\``
	else str += '\n\n**Top.gg**: ✅ Available! https://top.gg/bot/493316754689359874/vote'

	if (vote2CD) str += `\n**DiscordBotList**: \`${vote2CD}\``
	else str += '\n**DiscordBotList**: ✅ Available! https://discordbotlist.com/bots/lootcord/upvote'

	str += '\n\nVote on both websites for double the reward, you should receive a DM after you vote.'

	return str
}
