const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const scrambleQ = require('../json/scramble_words.json');
const config = require('../json/_config');

module.exports = {
    name: 'scramble',
    aliases: [''],
    description: 'Unscramble a random word!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const scrambleCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'scramble'
        });

        if(scrambleCD){
            return message.reply(`You need to wait  \`${scrambleCD}\`  before using this command again`);
        }

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
        
        await methods.addCD(message.client, {
            userId: message.author.id,
            type: 'scramble',
            time: config.cooldowns.scramble * 1000
        });

        const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id, { time: 30000 });
        let correct = false;
        let attempts = 0;
        collector.on("collect", response => {
            attempts+=1;
            if(response.content.toLowerCase() == finalWord){
                correct = true;
                let rewardItem = "";
                if(isHardMode){
                    if(scrambleDifficulty =="hard"){
                        methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                            if((chance < scrambleJSONlength/4) && hasenough){
                                rewardItem = "ultra_box";
                                methods.additem(message.author.id, 'ultra_box', 1);
                                message.reply(scrambleWinMsg(rewardItem));
                            }
                            else{
                                rewardItem = "$1,700";
                                message.reply(scrambleWinMsg(rewardItem));
                                methods.addmoney(message.author.id, 1700);
                            }
                        });
                    }
                    else if(scrambleDifficulty == "medium"){
                        methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                            if((chance < scrambleJSONlength/3) && hasenough){
                                rewardItem = "2x item_box";
                                methods.additem(message.author.id, 'item_box', 2);
                                message.reply(scrambleWinMsg(rewardItem));
                            }
                            else{
                                rewardItem = "$1,100";
                                message.reply(scrambleWinMsg(rewardItem));
                                methods.addmoney(message.author.id, 1100);
                            }
                        });
                    }
                    else{
                        methods.hasenoughspace(message.author.id, 2).then(hasenough => {
                            if((chance < scrambleJSONlength/3) && hasenough){
                                rewardItem = "2x item_box";
                                methods.additem(message.author.id, 'item_box', 2);
                                message.reply(scrambleWinMsg(rewardItem));
                            }
                            else{
                                rewardItem = "$800";
                                message.reply(scrambleWinMsg(rewardItem));
                                methods.addmoney(message.author.id, 800);
                            }
                        });
                    }
                }
                else{
                    if(scrambleDifficulty =="hard"){
                        methods.hasenoughspace(message.author.id, 2).then(hasenough => {
                            if((chance > scrambleJSONlength/2) && hasenough){
                                rewardItem = "2x item_box";
                                methods.additem(message.author.id, 'item_box', 2);
                                message.reply(scrambleWinMsg(rewardItem));
                            }
                            else{
                                rewardItem = "$650";
                                message.reply(scrambleWinMsg(rewardItem));
                                methods.addmoney(message.author.id, 650);
                            }
                        });
                    }
                    else if(scrambleDifficulty == "medium"){
                        methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                            if((chance > scrambleJSONlength/2) && hasenough){
                                rewardItem = "item_box";
                                methods.additem(message.author.id, 'item_box', 1);
                                message.reply(scrambleWinMsg(rewardItem));
                            }
                            else{
                                rewardItem = "$400";
                                message.reply(scrambleWinMsg(rewardItem));
                                methods.addmoney(message.author.id, 400);
                            }
                        });
                    }
                    else{
                        methods.hasenoughspace(message.author.id, 1).then(hasenough => {
                            if(hasenough){
                                rewardItem = "item_box";
                                methods.additem(message.author.id, 'item_box', 1);
                                message.reply(scrambleWinMsg(rewardItem));
                            }
                            else{
                                rewardItem = "$250";
                                message.reply(scrambleWinMsg(rewardItem));
                                methods.addmoney(message.author.id, 250);
                            }
                        });
                    }
                }
                collector.stop();
            }
        });
        collector.on("end", collected => {
            if(correct){
            }
            else{
                const embedScramble = new Discord.RichEmbed()
                .setTitle(lang.scramble[2])
                .setDescription("The word was : ```" + scrambleWord+"```")
                .setColor(16734296);
                message.channel.send(message.author, embedScramble);
            }
            message.client.sets.activeScramblers.delete(message.author.id);
        });
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

function scrambleWinMsg(itemReward){
    const embedScramble = new Discord.RichEmbed()
    .setTitle("**You got it correct!**")
    .setDescription("Reward : ```" + itemReward+"```")
    .setColor(9043800);
    return {embed: embedScramble};
}