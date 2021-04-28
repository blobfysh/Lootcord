const { DiscordInteractions } = require('slash-commands')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const debug = process.env.NODE_ENV !== 'production'
const token = process.env.BOT_TOKEN
const supportGuildID = process.env.BOT_GUILD
const clientId = process.env.BOT_CLIENT_ID

async function registerCommands() {
	const interactions = new DiscordInteractions({
		applicationId: clientId,
		authToken: token
	})
	const currentInteractions = await interactions.getApplicationCommands(debug ? supportGuildID : undefined)
	const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'src', 'slash-commands'))
	const commands = []

	// populate commands array
	for (const file of commandFiles) {
		const { command } = require(`../src/slash-commands/${file}`)

		commands.push(command)
	}

	// remove slash commands that don't exist anymore
	for (const interaction of currentInteractions) {
		const exists = commands.find(cmd => cmd.name === interaction.name)

		if (!exists) {
			await interactions.deleteApplicationCommand(interaction.id, debug ? supportGuildID : undefined)

			console.log(`- Removed slash command - ${interaction.name}`)
		}
	}

	// loop through command files and update/create slash commands
	for (const command of commands) {
		const slashCommand = currentInteractions.find(cmd => cmd.name === command.name)

		if (slashCommand) {
			// slash command already exists
			await updateCommand(interactions, slashCommand.id, command, debug ? supportGuildID : undefined)

			console.log(`* Updated slash command - ${slashCommand.name}`)
		}
		else {
			// create new slash command
			await createCommand(interactions, command, debug ? supportGuildID : undefined)

			console.log(`+ Created slash command - ${command.name}`)
		}
	}
}

async function createCommand(interactions, command, guildId = undefined) {
	const res = await interactions.createApplicationCommand(command, guildId)

	if (res.code === 30034) {
		// max daily commands created...
		throw new Error(res.message)
	}
	else if (res.retry_after) {
		// getting ratelimited
		console.log(`Ratelimited while trying to create ${command.name} - Retrying after ${res.retry_after} seconds`)
		await wait(res.retry_after * 1000)

		await createCommand(interactions, command, guildId)
	}
}

async function updateCommand(interactions, commandId, command, guildId = undefined) {
	const res = await interactions.editApplicationCommand(command, guildId)

	if (res.retry_after) {
		// getting ratelimited
		console.log(`Ratelimited while trying to update ${command.name} (${commandId}) - Retrying after ${res.retry_after} seconds`)
		await wait(res.retry_after * 1000)

		await updateCommand(interactions, commandId, command, guildId)
	}
}

async function wait(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

registerCommands().catch(err => console.log(err))
