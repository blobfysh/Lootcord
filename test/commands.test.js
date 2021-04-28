const fs = require('fs')
const path = require('path')

const categories = fs.readdirSync(path.join(__dirname, '../src/commands'))
const clanFiles = fs.readdirSync(path.join(__dirname, '../src/commands/clans/commands'))

const commands = []
const clanCommands = []

for (const category of categories) {
	const categoryCmds = fs.readdirSync(path.join(__dirname, `../src/commands/${category}`)).filter(file => file.endsWith('.js'))

	for (const commandFile of categoryCmds) {
		const { command } = require(`../src/commands/${category}/${commandFile}`)

		commands.push(command)
	}
}

for (const commandFile of clanFiles) {
	const { command } = require(`../src/commands/clans/commands/${commandFile}`)

	clanCommands.push(command)
}

describe('commands', () => {
	test('command list contains no duplicate names or aliases', () => {
		const commandNames = commands.map(command => command.name)
		const aliases = []

		commands.forEach(command => aliases.push(...command.aliases))

		const duplicates = [...commandNames, ...aliases].filter((a, i, arr) => a && arr.indexOf(a) !== i)

		expect(duplicates).toEqual([])
	})

	test('clan command list contains no duplicate names or aliases', () => {
		const commandNames = clanCommands.map(command => command.name)
		const aliases = []

		clanCommands.forEach(command => aliases.push(...command.aliases))

		const duplicates = [...commandNames, ...aliases].filter((a, i, arr) => a && arr.indexOf(a) !== i)

		expect(duplicates).toEqual([])
	})
})
