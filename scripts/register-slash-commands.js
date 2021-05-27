const { DiscordInteractions } = require('slash-commands')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const debug = process.env.NODE_ENV !== 'production'
const token = process.env.BOT_TOKEN
const supportGuildID = process.env.BOT_GUILD
const clientId = process.env.BOT_CLIENT_ID

const interactions = new DiscordInteractions({
	applicationId: clientId,
	authToken: token
})

// discord has no endpoint to find all guilds with slash commands, so you can manually keep track
// of them here and remove guild slash commands that no longer exist.
const guildsWithSlashCommands = ['497302646521069568', '454163538055790604']

async function registerCommands () {
	await registerGlobal()

	// guild slash commands will be registerd to support guild when debug is enabled so you can test them
	await registerGuild()
}

// register all slash command in global folder
async function registerGlobal () {
	const currentInteractions = await interactions.getApplicationCommands(debug ? supportGuildID : undefined)
	const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'src', 'slash-commands', 'global'))
	const commands = []

	// populate commands array
	for (const file of commandFiles) {
		const { command } = require(`../src/slash-commands/global/${file}`)

		commands.push(command)
	}

	// remove slash commands that don't exist anymore
	for (const interaction of currentInteractions) {
		const exists = commands.find(cmd => cmd.name === interaction.name)

		if (!exists) {
			await deleteCommand(interaction.id, debug ? supportGuildID : undefined)

			console.log(`- Removed slash command - ${interaction.name}`)
		}
	}

	// loop through command files and update/create slash commands
	for (const command of commands) {
		const slashCommand = currentInteractions.find(cmd => cmd.name === command.name)

		if (slashCommand) {
			// slash command already exists
			await updateCommand(slashCommand.id, command, debug ? supportGuildID : undefined)

			console.log(`* Updated slash command - ${slashCommand.name}`)
		}
		else {
			// create new slash command
			await createCommand(command, debug ? supportGuildID : undefined)

			console.log(`+ Created slash command - ${command.name}`)
		}
	}
}

// registers slash commands that are specific to guild
async function registerGuild () {
	const guildFiles = fs.readdirSync(path.join(__dirname, '..', 'src', 'slash-commands', 'guild'))
	const guildCommands = {}

	// populate guild commands object
	for (const file of guildFiles) {
		const { command } = require(`../src/slash-commands/guild/${file}`)

		for (const guild of command.guilds) {
			guildCommands[guild] ? guildCommands[guild].push(command) : guildCommands[guild] = [command]
		}
	}

	// remove guild slash commands that no longer exist
	for (const guild of guildsWithSlashCommands) {
		try {
			const currentInteractions = await interactions.getApplicationCommands(guild)

			for (const interaction of currentInteractions) {
				const existsInGuild = guildCommands[guild] && guildCommands[guild].find(cmd => cmd.name === interaction.name)

				if (!existsInGuild && !debug) {
					await deleteCommand(interaction.id, guild)

					console.log(`- Removed guild slash command - (${guild}) ${interaction.name}`)
				}
			}
		}
		catch (err) {
			// bot no longer has access to guild
			console.error(`Unable to retrieve slash commands for guild: ${guild}`)
		}
	}

	for (const guild in guildCommands) {
		try {
			const currentInteractions = await interactions.getApplicationCommands(debug ? supportGuildID : guild)

			// loop through command files and update/create slash commands
			for (const command of guildCommands[guild]) {
				const slashCommand = currentInteractions.find(cmd => cmd.name === command.name)

				if (slashCommand) {
					// slash command already exists
					await updateCommand(slashCommand.id, command, debug ? supportGuildID : guild)

					console.log(`* Updated guild slash command - (${guild}) ${slashCommand.name}`)
				}
				else {
					// create new slash command
					await createCommand(command, debug ? supportGuildID : guild)

					console.log(`+ Created guild slash command - (${guild}) ${command.name}`)
				}
			}
		}
		catch (err) {
			console.error(`Unable to retrieve slash commands for guild: ${guild}`)
		}
	}
}

async function createCommand (command, guildId = undefined) {
	const res = await interactions.createApplicationCommand(command, guildId)

	if (res.code === 30034) {
		// max daily commands created...
		throw new Error(res.message)
	}
	else if (res.retry_after) {
		// getting ratelimited
		console.log(`Ratelimited while trying to create ${command.name} - Retrying after ${res.retry_after} seconds`)
		await wait(res.retry_after * 1000)

		await createCommand(command, guildId)
	}
}

async function updateCommand (commandId, command, guildId = undefined) {
	const res = await interactions.editApplicationCommand(commandId, command, guildId)

	if (res.retry_after) {
		// getting ratelimited
		console.log(`Ratelimited while trying to update ${command.name} (${commandId}) - Retrying after ${res.retry_after} seconds`)
		await wait(res.retry_after * 1000)

		await updateCommand(commandId, command, guildId)
	}
}

async function deleteCommand (commandId, guildId = undefined) {
	const res = await interactions.deleteApplicationCommand(commandId, guildId)

	if (!res) {
		// getting ratelimited
		console.log(`Ratelimited while trying to delete ${commandId} - Retrying after 20 seconds`)
		await wait(20 * 1000)

		await deleteCommand(commandId, guildId)
	}
}

async function wait (ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

registerCommands().catch(err => console.log(err))
