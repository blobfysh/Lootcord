const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'vote',
	aliases: [],
	description: 'Vote for the bot to collect a reward!',
	long: 'Vote for the bot to receive a reward.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		const voteCD = await app.cd.getCD(message.author.id, 'vote')
		const vote2CD = await app.cd.getCD(message.author.id, 'vote2')

		await reply(message, getVotesAvailable(voteCD, vote2CD))
	}
}

const getVotesAvailable = exports.getVotesAvailable = function getVotesAvailable (vote1CD, vote2CD) {
	let str = '🎟 Vote for the bot to collect a reward!'

	if (vote1CD) str += `\n\n**Top.gg**: \`${vote1CD}\``
	else str += '\n\n**Top.gg**: ✅ Available! https://top.gg/bot/493316754689359874/vote'

	if (vote2CD) str += `\n**Discord Bot List**: \`${vote2CD}\``
	else str += '\n**Discord Bot List**: ✅ Available! https://discordbotlist.com/bots/lootcord/upvote'

	str += '\n\nVote on both websites for double the reward, you should receive a DM after you vote.'

	return str
}
