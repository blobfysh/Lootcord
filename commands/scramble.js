const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const scrambleQ = require('../json/scramble_words.json');

module.exports = {
    name: 'scramble',
    aliases: [''],
    description: 'Unscramble a random word!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        if(message.client.sets.scrambleCooldown.has(message.author.id)){
            return query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`).then(timeRow => {
                message.reply(lang.general[9].replace('{0}', ((900 * 1000 - ((new Date()).getTime() - timeRow[0].scrambleTime)) / 60000).toFixed(1)));
            });
        }
        else{
            let option = args[0];
            let scrambleJSONlength = Object.keys(scrambleQ).length
            let chance = Math.floor(Math.random() * scrambleJSONlength); //returns value 0 between 32 (1 of 10)
            let scrambleWord = scrambleQ[chance].word;  //json data word to scramble
            let scrambleDifficulty = scrambleQ[chance].difficulty;
            let scrambleHint = scrambleQ[chance].define;
            if(Math.random() <= .7){
                scrambleHint = scrambleQ[chance].hint;
            }
            let finalWord = scrambleWord.toLowerCase(); //final word to check if user got correct
            let isHardMode = false;
            
            const embedScramble = new Discord.RichEmbed()
            //.setTitle("**Difficulty : " + scrambleDifficulty + "**")
            .setFooter(lang.scramble[0])
            if(!option){
                message.reply(lang.scramble[1].replace('{0}', prefix));
                return;
            }
            else if(option.toLowerCase() == "easy"){
                embedScramble.setDescription("**Hint:** " + scrambleHint + "\nWord: ```" + (shuffleWordNoDupe(scrambleWord))+"```");
            }
            else if(option.toLowerCase() == "hard"){
                embedScramble.setDescription("Word: ```" + shuffleWordNoDupe(scrambleWord.toLowerCase())+"```");
                isHardMode = true;
            }
            else{
                message.reply(lang.scramble[1].replace('{0}', prefix));
                return;
            }

            if(scrambleDifficulty == "hard"){
                embedScramble.setColor(16734296);
            }
            else if(scrambleDifficulty == "medium"){
                embedScramble.setColor(15531864);
            }
            else{
                embedScramble.setColor(9043800);
            }

            message.channel.send(message.author, embedScramble);

            message.client.sets.activeScramblers.add(message.author.id);
            message.client.shard.broadcastEval(`this.sets.scrambleCooldown.add('${message.author.id}')`);
            query(`UPDATE cooldowns SET scrambleTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.scrambleCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET scrambleTime = ${0} WHERE userId = ${message.author.id}`);
            }, 900 * 1000);

            const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id, { time: 30000 });
            let correct = false;
            let attempts = 0;
            collector.on("collect", response => {
                attempts+=1;
                if(response.content.toLowerCase() == finalWord){
                    query(`SELECT * FROM items i
                    INNER JOIN scores s
                    ON i.userId = s.userId
                    WHERE s.userId="${message.author.id}"`).then(oldRow => {
                        const row = oldRow[0];
                        
                        correct = true;
                        let rewardItem = "";
                        if(isHardMode){
                            if(scrambleDifficulty =="hard"){
                                methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                                    if((chance < scrambleJSONlength/4) && hasenough){
                                        rewardItem = "ultra_box";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${message.author.id}`);
                                    }
                                    else{
                                        rewardItem = "$1700";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE scores SET money = ${row.money + 1700} WHERE userId = ${message.author.id}`);
                                    }
                                });
                            }
                            else if(scrambleDifficulty == "medium"){
                                methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                                    if((chance < scrambleJSONlength/3) && hasenough){
                                        rewardItem = "2x item_box";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE items SET item_box = ${row.item_box + 2} WHERE userId = ${message.author.id}`);
                                    }
                                    else{
                                        rewardItem = "$1100";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE scores SET money = ${row.money + 1100} WHERE userId = ${message.author.id}`);
                                    }
                                });
                            }
                            else{
                                methods.hasenoughspace(message.author.id, 2).then(hasenough => {
                                    if((chance < scrambleJSONlength/3) && hasenough){
                                        rewardItem = "2x item_box";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE items SET item_box = ${row.item_box + 2} WHERE userId = ${message.author.id}`);
                                    }
                                    else{
                                        rewardItem = "$800";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE scores SET money = ${row.money + 800} WHERE userId = ${message.author.id}`);
                                    }
                                });
                            }
                        }
                        else{
                            if(scrambleDifficulty =="hard"){
                                methods.hasenoughspace(message.author.id, 2).then(hasenough => {
                                    if((chance > scrambleJSONlength/2) && hasenough){
                                        rewardItem = "2x item_box";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE items SET item_box = ${row.item_box + 2} WHERE userId = ${message.author.id}`);
                                    }
                                    else{
                                        rewardItem = "$650";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE scores SET money = ${row.money + 650} WHERE userId = ${message.author.id}`);
                                    }
                                });
                            }
                            else if(scrambleDifficulty == "medium"){
                                methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                                    if((chance > scrambleJSONlength/2) && hasenough){
                                        rewardItem = "item_box";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE items SET item_box = ${row.item_box + 1} WHERE userId = ${message.author.id}`);
                                    }
                                    else{
                                        rewardItem = "$400";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE scores SET money = ${row.money + 400} WHERE userId = ${message.author.id}`);
                                    }
                                });
                            }
                            else{
                                methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                                    if(hasenough){
                                        rewardItem = "item_box";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE items SET item_box = ${row.item_box + 1} WHERE userId = ${message.author.id}`);
                                    }
                                    else{
                                        rewardItem = "$250";
                                        methods.scrambleWinMsg(message, rewardItem);
                                        query(`UPDATE scores SET money = ${row.money + 250} WHERE userId = ${message.author.id}`);
                                    }
                                });
                            }
                        }
                        collector.stop();
                    });
                }
            });
            collector.on("end", collected => {
                if(correct){
                    /*
                    const embedLog = new Discord.RichEmbed()
                    embedLog.setTitle("📝SCRAMBLE LOG CORRECT\n"+message.author.username+ " ID : " + message.author.id)
                    embedLog.setDescription("**Had a hint : `" + !isHardMode + "`**\nWord : ```" + scrambleWord+"```\nGuess attempts : `" + attempts + "`");
                    embedLog.setColor(9043800);
                    client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedLog);
                    return;
                    */
                }
                else{
                    const embedScramble = new Discord.RichEmbed()
                    .setTitle(lang.scramble[2])
                    .setDescription("The word was : ```" + scrambleWord+"```")
                    .setColor(16734296);
                    message.channel.send(message.author, embedScramble);

                    /*
                    const embedLog = new Discord.RichEmbed()
                    embedLog.setTitle("📝SCRAMBLE LOG INCORRECT\n"+message.author.username+ " ID : " + message.author.id)
                    embedLog.setDescription("**Had a hint : `" + !isHardMode + "`**\nWord : ```" + scrambleWord+"```\nGuess attempts : `" + attempts + "`");
                    embedLog.setColor(16734296);
                    client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedLog);
                    */
                }
                message.client.sets.activeScramblers.delete(message.author.id);
            });
        }
    },
}

function shuffle(word){
    var shuffledWord = '';
    word = word.split('');
    while (word.length > 0) {
        shuffledWord +=  word.splice(word.length * Math.random() << 0, 1);
    }
    return shuffledWord;
}

function shuffleWordNoDupe(word){
    var shuffled = shuffle(word);

    while(shuffled == word){
        shuffled = shuffle(word);
    }

    return shuffled
}