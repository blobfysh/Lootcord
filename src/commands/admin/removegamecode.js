
module.exports = {
    name: 'removegamecode',
    aliases: [''],
    description: "Remove a game key from the database.",
    long: "Remove a game key from the database.",
    args: {
        "name": "Name of game.",
    },
    examples: ["removegamecode fortnite"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let gameName = message.args[0];
        
        try{
            await app.query(`DELETE FROM gamesData WHERE gameName = '${gameName}'`);
            message.reply(`Successfully removed \`${gameName}\` from games database.`)
        }
        catch(err){
            message.reply("Error removing game `removegamecode <game_name>`: ```\n" + err + "```");
        }
    },
}