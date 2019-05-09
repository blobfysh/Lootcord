const Discord = require('discord.js');
const { query } = require('../../mysql.js');

module.exports = {
    name: 'addgamecode',
    aliases: [''],
    description: 'Add a game key to the database.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let gameName = args[0];
        let gameAmount = args[1];
        let gamePrice = args[2];
        let gameCurrency = args[3];
        let gameDisplay = args.slice(4).join(" ");

        if(gameDisplay == undefined || gameName == undefined || gameAmount == undefined || gamePrice == undefined || gameCurrency == undefined){
            return message.reply("ERROR ADDING GAME:\n`addgamecode <game_sql_name> <Amount to sell> <game price> <currency to purchase with> <game name to display>`");
        }
        else{
            query("INSERT INTO gamesData (gameName, gameAmount, gamePrice, gameCurrency, gameDisplay) VALUES (?, ?, ?, ?, ?)", [gameName, parseInt(gameAmount), parseInt(gamePrice), gameCurrency, gameDisplay]);
            message.reply("Game added!")
        }
    },
}