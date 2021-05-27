exports.run = function (msg) {
	console.log('[APP] Reloading commands')

	for (const path of Object.keys(require.cache)) {
		if (
			(path.includes('src/commands') || path.includes('src\\commands') || path.includes('src/slash-commands') || path.includes('src\\slash-commands')) &&
			path.endsWith('.js')
		) {
			delete require.cache[path]
		}
	}

	this.commands = this.loadCommands()
	this.clanCommands = this.loadClanCommands()
	this.slashCommands = this.loadSlashCommands()
}
