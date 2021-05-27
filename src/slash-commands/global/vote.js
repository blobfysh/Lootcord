const { getVotesAvailable } = require('../../commands/rewards/vote')

exports.command = {
	name: 'vote',
	description: 'Vote for the bot to collect a reward!',
	requiresAcc: true,
	requiresActive: false,
	options: [],

	async execute (app, interaction, { guildInfo, serverSideGuildId }) {
		const voteCD = await app.cd.getCD(interaction.member.user.id, 'vote')
		const vote2CD = await app.cd.getCD(interaction.member.user.id, 'vote2')

		return interaction.respond({
			content: getVotesAvailable(voteCD, vote2CD)
		})
	}
}
