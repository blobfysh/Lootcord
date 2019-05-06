const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const triviaQ = require('../json/_trivia_questions.json');

module.exports = {
    name: 'trivia',
    aliases: [''],
    description: 'Answer a random question for a reward!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`).then(timeRow => {
            if(message.client.sets.triviaUserCooldown.has(message.author.id)){
                message.reply(lang.general[9].replace('{0}', ((900 * 1000 - ((new Date()).getTime() - timeRow[0].triviaTime)) / 60000).toFixed(1)));
                return;
            }
            else{
                message.client.shard.broadcastEval(`this.sets.triviaUserCooldown.add('${message.author.id}')`);
                query(`UPDATE cooldowns SET triviaTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                setTimeout(() => {
                    message.client.shard.broadcastEval(`this.sets.triviaUserCooldown.delete('${message.author.id}')`);
                    query(`UPDATE cooldowns SET triviaTime = ${0} WHERE userId = ${message.author.id}`);
                }, 900 * 1000);
                
                let chance = Math.floor(Math.random() * Object.keys(triviaQ).length); //returns value 0 between LENGTH OF JSON FILE (1 of 10)               |   JSON FILE HAS 547 QUESTIONS AVAILABLE

                let questionInfo = triviaQ[chance].question;
                let questionA = triviaQ[chance].a;
                let questionB = triviaQ[chance].b;
                let questionC = triviaQ[chance].c;
                let questionD = triviaQ[chance].d;

                const embedTrivia = new Discord.RichEmbed()
                .setAuthor('Category - ' + triviaQ[chance].category)
                .setTitle(questionInfo)
                .setColor(16777215)
                .setDescription(`🇦: ${questionA}\n🇧: ${questionB}\n🇨: ${questionC}\n🇩: ${questionD}`)
                .setFooter(lang.trivia[0])

                message.channel.send(embedTrivia).then(botMessage => {
                    botMessage.react('🇦').then(() => botMessage.react('🇧')).then(() => botMessage.react('🇨')).then(() => botMessage.react('🇩'));
                    const filter = (reaction, user) => {
                        return ['🇦', '🇧','🇨','🇩'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();

                        function triviaReward(){
                            query(`SELECT * FROM scores INNER JOIN items ON scores.userId = items.userId WHERE scores.userId = "${message.author.id}"`).then(rewardRow => {
                                let chanceR = Math.floor(Math.random() * 10); //returns 0-9 (10% chance)
                                
                                let rewardItem = "";
                                methods.hasenoughspace(message.author.id, 2).then(hasenough => {
                                    if (chanceR <= 0 && hasenough){
                                        rewardItem = "`ammo_box`";
                                        query(`UPDATE items SET ammo_box = ${rewardRow[0].ammo_box + 1} WHERE userId = ${message.author.id}`);
                                    }
                                    else if (chanceR >= 5 && hasenough){
                                        rewardItem = "2x `item_box`";
                                        query(`UPDATE items SET item_box = ${rewardRow[0].item_box + 2} WHERE userId = ${message.author.id}`);
                                    }
                                    else{//40% chance
                                        rewardItem = "`$1000`";
                                        query(`UPDATE scores SET money = ${rewardRow[0].money + 1000} WHERE userId = ${message.author.id}`);
                                    }
                                    const embedReward = new Discord.RichEmbed()
                                    .setTitle(`${(triviaQ[chance][triviaQ[chance].correct_answer]).toUpperCase()} IS CORRECT`)
                                    .setColor(720640)
                                    .addField("Reward", rewardItem)
                                    botMessage.edit(embedReward);
                                });
                            });
                        }

                        if(reaction.emoji.name === '🇦' && triviaQ[chance].correct_answer == "a"){
                            
                            triviaReward();
                        }
                        else if(reaction.emoji.name === '🇧' && triviaQ[chance].correct_answer == "b"){
                            
                            triviaReward();
                        }
                        else if(reaction.emoji.name === '🇨' && triviaQ[chance].correct_answer == "c"){
                            
                            triviaReward();
                        }
                        else if(reaction.emoji.name === '🇩' && triviaQ[chance].correct_answer == "d"){
                            
                            triviaReward();
                        }
                        else{
                            const embedWrong = new Discord.RichEmbed() 
                            .setTitle('INCORRECT')
                            .setColor(13632027)
                            .addField("Reward", "`shame`")
                            botMessage.edit(embedWrong);
                        }
                    }).catch(collected => {
                        botMessage.delete();
                        message.reply(lang.errors[5]);
                    });
                });
            }
        });
    },
}