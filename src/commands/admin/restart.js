const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'restart',
	aliases: [],
	description: 'Restarts a cluster.',
	long: 'Restarts a cluster.',
	args: {
		'Cluster ID': 'ID of cluster to reboot.'
	},
	examples: ['restart 0'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const clusterID = args[0]

		if (clusterID === undefined) {
			return reply(message, '❌ You forgot to include a cluster ID.')
		}
		else if (!parseInt(clusterID) && clusterID !== '0') {
			return reply(message, '❌ Only numbers are supported.')
		}

		try {
			await reply(message, `Restarting cluster \`${clusterID}\`...`)

			app.restartCluster(parseInt(clusterID))
		}
		catch (err) {
			await reply(message, `Error messaging user:\`\`\`\n${err}\`\`\``)
		}
	}
}
