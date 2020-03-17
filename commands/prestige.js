const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const general = require('../methods/general');
const config = require('../json/_config');
const icons = require('../json/icons');
const itemdata = require('../json/completeItemList');
const starting_price = 100000000;
const starting_value = 10000;

module.exports = {
    name: 'prestige',
    aliases: [''],
    description: 'Restart and gain new stats!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];
        const price = getPrice(row.prestige);
        let requiredItemCt = getCtRequired(row.prestige);
        let requiredItemVal = getValRequired(row.prestige);

        if(row.prestige >= 2){
            return message.reply('👀 You are the highest prestige level possible right now. We have to work on more banners and badges for the higher prestige levels.')
        }

        const prestigeEmbed = new Discord.RichEmbed()
        .setTitle('Upgrade your prestige level!')
        .addField('You will lose', `${icons.minus} Trade-in all items (except ***Limited***)\n${icons.minus} Hand over your Lootcoins (${methods.formatMoney(row.money)} → ${methods.formatMoney(100)})\n${icons.minus} Reset level EXP and skills (Lvl ${row.level} → 1)\n${icons.minus} Stats such as kills and deaths reset`)
        .addField('Gain the following', `${icons.plus} A unique \`prestige_1\` banner\n${icons.plus} A badge next to your name displayed on your profile, leaderboards, and attack menus\n${icons.plus} \`5\` permanent inventory slots (${config.base_inv_slots + (5 * row.prestige)} → ${config.base_inv_slots + (5 * (row.prestige + 1))})`)
        .addField('Minimum Lootcoin Required', methods.formatMoney(price), true)
        .addField('Minimum Items Required', `${requiredItemCt} (With a total value of atleast ${methods.formatMoney(requiredItemVal)})`, true)
        .setColor(13215302)

        const botMessage = await message.reply(prestigeEmbed);
        await botMessage.react('✅');
        await botMessage.react('❌');
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };
    
        try{
            const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
            const reaction = collected.first();
    
            if(reaction.emoji.name === '✅'){
                const userItems = await methods.getuseritems(message.author.id, {amounts: true, countBanners: true, countLimited: false, sep: '`', icon: true});

                if(!await methods.hasmoney(message.author.id, price)){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', lang.buy[4]));
                }
                else if(row.prestige !== (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0].prestige){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', 'Did your stats change while upgrading?'));
                }
                else if(userItems.itemCount < requiredItemCt){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', `You must bring more items than that! (You have: ${userItems.itemCount} Required: ${requiredItemCt})`));
                }
                else if(userItems.invValue < requiredItemVal){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', `The items in your inventory are not worth more than the required value. (Yours: ${methods.formatMoney(userItems.invValue)} Required: ${methods.formatMoney(requiredItemVal)})`));
                }
                else{
                    await query(`UPDATE scores SET prestige = prestige + 1 WHERE userId = "${message.author.id}"`);
                    await resetData(message, row.prestige);

                    const prestigeSuccess = new Discord.RichEmbed()
                    .setTitle('Success!')
                    .setDescription('✅ Prestige increased to ' + (row.prestige + 1))
                    message.reply(prestigeSuccess);
                }
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit(prestigeEmbed.setFooter("Command timed out."));
        }
    },
}

async function resetData(message, prestigeLvl){
    const userRow = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];
    const userItems = await general.getItemObject(message.author.id);

    for(var item in userRow){
        //ignore userId and createdAt columns (these are unique and will never change)
        if(item !== 'userId' && item !== 'createdAt' && item !== 'clanId' && item !== 'clanRank' && item !== 'lastActive' && item !== 'notify1' && item !== 'notify2' && item !== 'notify3' && item !== 'status' && item !== 'prestige'){

            //switch to set columns that have default values other than 0
            switch(item){
                case 'health': resetVal = 100; break;
                case 'maxHealth': resetVal = 100; break;
                case 'level': resetVal = 1; break;
                case 'money': resetVal = 100; break;
                case 'backpack': resetVal = 'none'; break;
                case 'armor': resetVal = 'none'; break;
                case 'ammo': resetVal = 'none'; break;
                case 'inv_slots': resetVal = Math.floor((2**prestigeLvl) * 5); break;
                case 'scaledDamage': resetVal = 1.00; break;
                case 'banner': resetVal = 'recruit'; break;
                case 'language': resetVal = 'en-us'; break;
                case 'status': resetVal = ''; break;
                case 'power': resetVal = 5; break;
                case 'max_power': resetVal = 5; break;
                default: resetVal = 0;
            }

            if(item == 'banner'){
                switch(prestigeLvl + 1){
                    case 1: resetVal = 'recruit'; break;
                    case 2: resetVal = 'recruit'; break;
                    default: resetVal = 'recruit'; break;
                }
            }

            //run this query every iteration to reset each column
            await query(`UPDATE scores SET ${item} = '${resetVal}' WHERE userId = '${message.author.id}'`);
        }
    }

    for(var item in userItems){
        if(itemdata[item].rarity !== 'Limited'){
            await query(`DELETE FROM user_items WHERE userId = '${message.author.id}' AND item = '${item}'`);
        }
    }
}

function getPrice(cur_prestige){
    return Math.floor((10**cur_prestige) * starting_price);
}

function getCtRequired(cur_prestige){
    return Math.floor((1.5**cur_prestige) * 10);
}

function getValRequired(cur_prestige){
    return Math.floor((2**cur_prestige) * starting_value);
}