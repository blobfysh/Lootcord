const { DiscordInteractions } = require('slash-commands')

require('dotenv').config()

const debug = process.env.NODE_ENV !== 'production'
const token = process.env.BOT_TOKEN
const supportGuildID = process.env.BOT_GUILD
const clientId = process.env.BOT_CLIENT_ID

async function removeCommands() {
	const interactions = new DiscordInteractions({
		applicationId: clientId,
		authToken: token
	})

	// remove current slash commands
	const currentInteractions = await interactions.getApplicationCommands(debug ? supportGuildID : undefined)
	for (const i of currentInteractions) {
		await interactions.deleteApplicationCommand(i.id, debug ? supportGuildID : undefined)
	}

	console.log(`Removed ${currentInteractions.length} slash commands.`)
}

removeCommands().catch(err => console.log(err))
