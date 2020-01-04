const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const general = require('../methods/general');
const upgrOptions = ['health', 'vitality', 'strength', 'luck'];

module.exports = {
    name: 'upgrade',
    aliases: [''],
    description: 'Upgrade your stats!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];
        let upgrOpt = args[0] !== undefined ? args[0].toLowerCase() : "";
        let upgrAmnt = general.getNum(args[1]);

        if(row.stats > 0 && upgrOptions.includes(upgrOpt)){
            if(row.stats < upgrAmnt){
                return message.reply("You don't have enough skill points to upgrade that much!");
            }
            else if(upgrOpt == "health" || upgrOpt == "vitality"){
                //upgrade hp
                query(`UPDATE scores SET maxHealth = ${row.maxHealth + (5 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                query(`UPDATE scores SET stats = ${row.stats - (1 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                query(`UPDATE scores SET used_stats = ${row.used_stats + (1 * upgrAmnt)} WHERE userId = "${message.author.id}"`);

                const skillEmbed = new Discord.RichEmbed()
                .setColor(14634070)
                .setAuthor(message.member.displayName, message.author.avatarURL)
                .setTitle(lang.upgrade[5].replace('{0}', upgrAmnt))
                .setDescription(lang.upgrade[8].replace('{0}', (row.maxHealth + (5 * upgrAmnt))))
                .setFooter(lang.upgrade[11].replace('{0}', (row.stats - (1 * upgrAmnt))))

                message.channel.send(skillEmbed);
                return;
            }
            else if(upgrOpt == "strength"){
                query(`UPDATE scores SET scaledDamage = ${(row.scaledDamage + (0.03 * upgrAmnt)).toFixed(2)} WHERE userId = "${message.author.id}"`);
                query(`UPDATE scores SET stats = ${row.stats - (1 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                query(`UPDATE scores SET used_stats = ${row.used_stats + (1 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                
                const skillEmbed = new Discord.RichEmbed()
                .setColor(10036247)
                .setAuthor(message.member.displayName, message.author.avatarURL)
                .setTitle(lang.upgrade[6].replace('{0}', upgrAmnt))
                .setDescription(lang.upgrade[9].replace('{0}', (row.scaledDamage + (0.03 * upgrAmnt)).toFixed(2)))
                .setFooter(lang.upgrade[11].replace('{0}', (row.stats - (1 * upgrAmnt))))
                
                message.channel.send(skillEmbed);
                return;
            }
            else if(upgrOpt == "luck"){
                query(`UPDATE scores SET luck = ${row.luck + (2 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                query(`UPDATE scores SET stats = ${row.stats - (1 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                query(`UPDATE scores SET used_stats = ${row.used_stats + (1 * upgrAmnt)} WHERE userId = "${message.author.id}"`);
                
                const skillEmbed = new Discord.RichEmbed()
                .setColor(5868887)
                .setAuthor(message.member.displayName, message.author.avatarURL)
                .setTitle(lang.upgrade[7].replace('{0}', upgrAmnt))
                .setDescription(lang.upgrade[10])
                .setFooter(lang.upgrade[11].replace('{0}', (row.stats - (1 * upgrAmnt))))

                message.channel.send(skillEmbed);
                return;
            }
        }
        else if(row.stats > 0){
            const skillEmbed = new Discord.RichEmbed()
            .setColor(1)
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle(lang.upgrade[0].replace('{0}', row.stats))
            .setDescription(lang.upgrade[1])
            .addField("💗 Vitality", lang.upgrade[2].replace('{0}', (row.maxHealth + 5)))
            .addField("💥 Strength", lang.upgrade[3].replace('{0}', (row.scaledDamage + 0.03).toFixed(2)))
            .addField("🍀 Luck", lang.upgrade[4].replace('{0}', (row.luck + 2)))

            message.channel.send(skillEmbed).then(botMessage => {
                botMessage.react('💗').then(() => botMessage.react('💥').then(() => botMessage.react('🍀').then(() => botMessage.react('❌') )));
                const filter = (reaction, user) => {
                    return ['💗', '💥', '🍀', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 30000, errors: ['time'] }).then(collected => {
                    function getStats(type){
                        query(`SELECT * FROM scores WHERE userId="${message.author.id}"`).then(oldRow => {
                            const row = oldRow[0];

                            if(row.stats <= 0){
                                botMessage.edit("You don't have the skill points to do that!");
                            }
                            else if(type == "hp"){
                                query(`UPDATE scores SET maxHealth = ${row.maxHealth + 5} WHERE userId = "${message.author.id}"`);
                                query(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                                query(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                                
                                const skillEmbed = new Discord.RichEmbed()
                                .setColor(14634070)
                                .setAuthor(message.member.displayName, message.author.avatarURL)
                                .setTitle(lang.upgrade[5])
                                .setDescription(lang.upgrade[8].replace('{0}', (row.maxHealth + 5)))
                                .setFooter(lang.upgrade[11].replace('{0}', (row.stats - 1)))
                                
                                botMessage.edit(skillEmbed);
                            }
                            else if(type === "strength"){
                                query(`UPDATE scores SET scaledDamage = ${(row.scaledDamage + 0.03).toFixed(2)} WHERE userId = "${message.author.id}"`);
                                query(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                                query(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                                
                                const skillEmbed = new Discord.RichEmbed()
                                .setColor(10036247)
                                .setAuthor(message.member.displayName, message.author.avatarURL)
                                .setTitle(lang.upgrade[6])
                                .setDescription(lang.upgrade[9].replace('{0}', (row.scaledDamage + 0.03).toFixed(2)))
                                .setFooter(lang.upgrade[11].replace('{0}', (row.stats - 1)))
                                
                                botMessage.edit(skillEmbed);
                            }
                            else if(type === "luck"){
                                query(`UPDATE scores SET luck = ${row.luck + 2} WHERE userId = "${message.author.id}"`);
                                query(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                                query(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                                
                                const skillEmbed = new Discord.RichEmbed()
                                .setColor(5868887)
                                .setAuthor(message.member.displayName, message.author.avatarURL)
                                .setTitle(lang.upgrade[7])
                                .setDescription(lang.upgrade[10])
                                .setFooter(lang.upgrade[11].replace('{0}', (row.stats - 1)))
                                
                                botMessage.edit(skillEmbed);
                            }
                        });
                    }
                    const reaction = collected.first();
                    if(reaction.emoji.name === '💗'){
                        getStats("hp")
                    }
                    else if(reaction.emoji.name === '💥'){
                        getStats("strength")
                    }
                    else if(reaction.emoji.name === '🍀'){
                        getStats("luck")
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply(lang.errors[3]);
                });
            });
        }
        else{
            message.reply(lang.upgrade[12]);
        }
    },
}