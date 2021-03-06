const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'setprefix',
	aliases: ['prefix'],
	description: 'Changes bot prefix for server.',
	long: 'Used to change the prefix for the server.\nUser **MUST** have the Manage Server permission.',
	args: { prefix: 'Input to change server prefix to. Can be 1-5 characters long.' },
	examples: ['setprefix t!'],
	permissions: ['sendMessages'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		let prefixString = args[0]

		if (prefixString === undefined || prefixString === '' || prefixString.length > 5) {
			return reply(message, `Please enter a prefix up to 5 characters long! \`${prefix}setprefix *****\``)
		}
		else if (!/^[\w!$%^&*()\-+=~'";<>,.?|\\{}[\]:]+$/.test(prefixString)) {
			return reply(message, '❌ White space and some special characters (@, #, `) are not supported in prefixes.')
		}

		const prefixRow = (await app.query(`SELECT * FROM guildprefix WHERE guildId = "${message.channel.guild.id}"`))[0]

		if (prefixRow) await app.query(`DELETE FROM guildprefix WHERE guildId = "${message.channel.guild.id}"`)

		prefixString = prefixString.toLowerCase()

		await app.query('INSERT IGNORE INTO guildprefix (guildId, prefix) VALUES (?, ?)', [message.channel.guild.id, prefixString])
		await app.cache.set(`prefix|${message.channel.guild.id}`, prefixString, 43200)

		await reply(message, `Server prefix successfully changed to \`${prefixString}\`. For example, you can now use \`${prefixString}help\``)
	}
}
