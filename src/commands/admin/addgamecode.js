
module.exports = {
    name: 'addgamecode',
    aliases: [''],
    description: "Add a game key to the database.",
    long: "Add a game key to the database. This game will be displayed for sale in the `shop`.",
    args: {
        "name": "Name of game, (will be used to purchase ex. `buy game_name`).",
        "amount": "Amount of copies of game to sell.",
        "price": "Price of game.",
        "currency": "Currency used to purchase game, can be `money` or a valid item.",
        "display": "The title of the game to display in the shop, can contain spaces."
    },
    examples: ["addgamecode fortnite 1 100 token Fortnite (POGGERS)"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let gameName = message.args[0];
        let gameAmount = message.args[1];
        let gamePrice = message.args[2];
        let gameCurrency = message.args[3];
        let gameDisplay = message.args.slice(4).join(" ");

        if(gameDisplay == undefined || gameName == undefined || gameAmount == undefined || gamePrice == undefined || gameCurrency == undefined){
            return message.reply("ERROR ADDING GAME:\n`addgamecode <game_sql_name> <Amount to sell> <game price> <currency to purchase with> <game name to display>`");
        }
        else{
            await app.query("INSERT INTO gamesData (gameName, gameAmount, gamePrice, gameCurrency, gameDisplay) VALUES (?, ?, ?, ?, ?)", [gameName, parseInt(gameAmount), parseInt(gamePrice), gameCurrency, gameDisplay]);
            
            message.reply(`Successfully added \`${gameName}\` to the games database.`)
        }
    },
}