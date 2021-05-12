const { DiscordInteractions } = require('slash-commands')

require('dotenv').config()

const debug = process.env.NODE_ENV !== 'production'
const token = process.env.BOT_TOKEN
const supportGuildID = process.env.BOT_GUILD
const clientId = process.env.BOT_CLIENT_ID

const interactions = new DiscordInteractions({
	applicationId: clientId,
	authToken: token
})

async function removeCommands() {
	// remove current slash commands
	const currentInteractions = await interactions.getApplicationCommands(debug ? supportGuildID : undefined)
	for (const i of currentInteractions) {
		await deleteCommand(i.id, debug ? supportGuildID : undefined)
	}

	console.log(`Removed ${currentInteractions.length} slash commands.`)
}

async function deleteCommand(commandId, guildId = undefined) {
	const res = await interactions.deleteApplicationCommand(commandId, guildId)

	if (!res) {
		// getting ratelimited
		console.log(`Ratelimited while trying to delete ${commandId} - Retrying after 20 seconds`)
		await wait(20 * 1000)

		await deleteCommand(commandId, guildId)
	}
}

async function wait(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

removeCommands().catch(err => console.log(err))
