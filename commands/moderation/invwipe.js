const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const config = require('../../json/_config.json');
const method = require('../../methods/acc_code_handler.js');

module.exports = {
    name: 'invwipe',
    aliases: ['inventorywipe', 'wipeinventory'],
    description: 'Wipes a users inventory.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        
        let userId = args[0];
        let banReason = args.slice(1).join(" ");

        if(userId !== undefined && userId !== ""){
            if(banReason == undefined || banReason == ""){
                banReason = "No reason provided.";
            }

            try{
                const userAccInfo = await method.getinvcode(message, userId);
                const userRow = (await query(`SELECT * FROM scores WHERE userId = '${userId}'`))[0];
                var resetVal;

                //iterate every column in row
                Object.keys(userRow).forEach(item => {

                    //ignore userId and createdAt columns (these are unique and will never change)
                    if(item !== 'userId' && item !== 'createdAt' && item !== 'clanId' && item !== 'clanRank' && item !== 'lastActive'){

                        //switch to set columns that have default values other than 0
                        switch(item){
                            case 'health': resetVal = 100; break;
                            case 'maxHealth': resetVal = 100; break;
                            case 'level': resetVal = 1; break;
                            case 'money': resetVal = 100; break;
                            case 'backpack': resetVal = 'none'; break;
                            case 'armor': resetVal = 'none'; break;
                            case 'inv_slots': resetVal = 0; break;
                            case 'scaledDamage': resetVal = 1.00; break;
                            case 'banner': resetVal = 'recruit'; break;
                            case 'language': resetVal = 'en-us'; break;
                            case 'status': resetVal = ''; break;
                            case 'power': resetVal = 5; break;
                            case 'max_power': resetVal = 5; break;
                            default: resetVal = 0;
                        }

                        //run this query every iteration to reset each column
                        query(`UPDATE scores SET ${item} = '${resetVal}' WHERE userId = '${userId}'`);
                    }
                });
                
                query(`DELETE FROM user_items WHERE userId = '${userId}'`);

                const user = await message.client.fetchUser(userId);

                message.client.shard.broadcastEval(`
                    const channel = this.channels.get('${config.logChannel}');
            
                    if(channel){
                        channel.send({embed: {
                                color: 11346517,
                                title: "\`${user.tag}\`'s data prior to wipe",
                                description: "User account code:\`\`\`${userAccInfo.invCode}\`\`\`",
                            }
                        });
                        true;
                    }
                    else{
                        false;
                    }
                `);
                
                const invWipeMsg = new Discord.RichEmbed()
                .setAuthor(`❗ Inventory Wiped ❗`)
                .setTitle("**A moderator has wiped your inventory!**")
                .setDescription("`" + banReason + "`")
                .setColor(13064193)
                .setFooter("https://lootcord.com | Only moderators can send you messages.")

                message.reply(`Inventory cleared for \`${user.tag}\`. A log of their old inventory has been created in <#${config.logChannel}>.`);
                await user.send(invWipeMsg);
            }
            catch(err){
                message.reply('Unable to send message to user, their inventory was still wiped however. ```' + err + '```');
            }
        }
        else{
            message.reply("This command wipes a users inventory. `"+prefix+"invwipe <id> <reason>`");
        }
    },
}