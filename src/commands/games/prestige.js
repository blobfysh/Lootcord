const starting_price = 100000000;
const starting_value = 10000;

module.exports = {
    name: 'prestige',
    aliases: [''],
    description: 'Restart and gain new stats!',
    long: 'Trade all experience and items for permanent stats! Cost to prestige increases with each level.',
    args: {},
    examples: ["prestige"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const price = getPrice(row.prestige);
        let requiredItemCt = getCtRequired(row.prestige);
        let requiredItemVal = getValRequired(row.prestige);

        if(row.prestige >= 2){
            return message.reply('👀 You are the highest prestige level possible right now. We have to work on more banners and badges for the higher prestige levels.')
        }

        const prestigeEmbed = new app.Embed()
        .setTitle('Upgrade your prestige level!')
        .addField('You will lose', `${app.icons.minus} Trade-in all items (except ***Limited***)\n${app.icons.minus} Hand over your Lootcoins (${app.common.formatNumber(row.money)} → ${app.common.formatNumber(100)})\n${app.icons.minus} Reset level EXP and skills (Lvl ${row.level} → 1)\n${app.icons.minus} Stats such as kills and deaths reset`)
        .addField('Gain the following', `${app.icons.plus} A unique \`prestige_1\` banner\n${app.icons.plus} A badge next to your name displayed on your profile, leaderboards, and attack menus\n${app.icons.plus} \`5\` permanent inventory slots (${app.config.baseInvSlots + (5 * row.prestige)} → ${app.config.baseInvSlots + (5 * (row.prestige + 1))})`)
        .addField('Minimum Lootcoin Required', app.common.formatNumber(price), true)
        .addField('Minimum Items Required', `${requiredItemCt} (With a total value of atleast ${app.common.formatNumber(requiredItemVal)})`, true)
        .setColor(13215302)

        const botMessage = await message.channel.createMessage(prestigeEmbed);
    
        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);
    
            if(confirmed){
                const userItems = await app.itm.getUserItems(message.author.id, { countBanners: true, countLimited: false });

                if(!await app.player.hasMoney(message.author.id, price)){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', `You don't have enough money! You currently have ${app.common.formatNumber(row.money)}`));
                }
                else if(row.prestige !== (await app.player.getRow(message.author.id)).prestige){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', 'Did your stats change while upgrading?'));
                }
                else if(userItems.itemCount < requiredItemCt){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', `You must bring more items than that! (You have: ${userItems.itemCount} Required: ${requiredItemCt})`));
                }
                else if(userItems.invValue < requiredItemVal){
                    botMessage.edit(prestigeEmbed.addField('❌ Error', `The items in your inventory are not worth more than the required value. (Yours: ${app.common.formatNumber(userItems.invValue)} Required: ${app.common.formatNumber(requiredItemVal)})`));
                }
                else{
                    await app.query(`UPDATE scores SET prestige = prestige + 1 WHERE userId = "${message.author.id}"`);
                    await resetData(app, message, row.prestige);
                    await app.itm.addBadge(message.author.id, 'prestige_1');
                    
                    const prestigeSuccess = new app.Embed()
                    .setTitle('Success!')
                    .setDescription('✅ Prestige increased to ' + (row.prestige + 1))
                    botMessage.edit(prestigeSuccess);
                }
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit(prestigeEmbed.setFooter("❌ Command timed out."));
        }
    },
}

async function resetData(app, message, prestigeLvl){
    const userRow = await app.player.getRow(message.author.id);
    const userItems = await app.itm.getItemObject(message.author.id);

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
            await app.query(`UPDATE scores SET ${item} = '${resetVal}' WHERE userId = '${message.author.id}'`);
        }
    }

    for(var item in userItems){
        if(app.itemdata[item].rarity !== 'Limited'){
            await app.query(`DELETE FROM user_items WHERE userId = '${message.author.id}' AND item = '${item}'`);
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