const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const general = require('../methods/general');
const upgrOptions = ['health', 'strength', 'luck'];

module.exports = {
    name: 'upgrade',
    aliases: [''],
    description: 'Upgrade your skills!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];
        let upgrOpt = args[0] !== undefined ? args[0].toLowerCase() : "";
        let upgrAmnt = general.getNum(args[1]);

        if(row.used_stats + upgrAmnt > 50){
            return message.reply("❌ Upgrading that much would put you over the max (50 skills upgraded, you've upgraded `" + row.used_stats + "` times). You can use a `reroll_scroll` to reset your skills.");
        }

        let type = getType(upgrOpt);
        let price = getPrice(row.used_stats, upgrAmnt);

        if(upgrOptions.includes(upgrOpt)){
            const botMessage = await message.reply(lang.upgrade[13].replace('{0}', upgrAmnt).replace('{1}', type.display).replace('{2}', row[type.row]).replace('{3}', nextLevel(type, row, upgrAmnt)).replace('{4}', methods.formatMoney(price)));
            await botMessage.react('✅');
            await botMessage.react('❌');
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
        
            try{
                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
                const reaction = collected.first();
        
                if(reaction.emoji.name === '✅'){
                    if(!await methods.hasmoney(message.author.id, price)){
                        botMessage.edit(lang.buy[4]);
                    }
                    else if(row.used_stats !== (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0].used_stats){
                        botMessage.edit('❌ Error: did your stats change while upgrading?');
                    }
                    else if(row.used_stats + upgrAmnt > 50){
                        botMessage.edit("❌ Upgrading that much would put you over the max (50 skills upgraded). You can use a `reroll_scroll` to reset your skills.");
                    }
                    else{
                        await query(`UPDATE scores SET used_stats = used_stats + ${upgrAmnt} WHERE userId = "${message.author.id}"`);
                        await methods.removemoney(message.author.id, price);
                        await purchaseSkills(message, type.title, upgrAmnt);

                        botMessage.edit(lang.upgrade[14].replace('{0}', upgrAmnt).replace('{1}', type.display));
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time!");
            }
        }
        else{
            const skillEmbed = new Discord.RichEmbed()
            .setColor(1)
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle(lang.upgrade[1])
            .setDescription(lang.upgrade[0].replace('{0}', methods.formatMoney(price))) //lang.upgrade[0].replace('{0}', methods.formatMoney(price))
            .addField("💗 Health", lang.upgrade[2].replace('{0}', row.maxHealth).replace('{1}', (row.maxHealth + 5)))
            .addField("💥 Strength", lang.upgrade[3].replace('{0}', (row.scaledDamage).toFixed(2)).replace('{1}', (row.scaledDamage + 0.03).toFixed(2)))
            .addField("🍀 Luck", lang.upgrade[4].replace('{0}', row.luck).replace('{1}', (row.luck + 2)))
            .setFooter('The cost to upgrade skills doubles after each upgrade. You can reset skills with a reroll_scroll')

            const botMessage = await message.reply(skillEmbed);
            await botMessage.react('💗');
            await botMessage.react('💥');
            await botMessage.react('🍀');
            await botMessage.react('❌');
            const filter = (reaction, user) => {
                return ['💗', '💥', '🍀', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            try{
                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
                const reaction = collected.first();
        
                if(reaction.emoji.name === '💗'){
                    type = getType('health');

                    if(!await methods.hasmoney(message.author.id, price)){
                        botMessage.edit(lang.buy[4]);
                    }
                    else if(row.used_stats !== (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0].used_stats){
                        botMessage.edit('❌ Error: did your stats change while upgrading?');
                    }
                    else{
                        await query(`UPDATE scores SET used_stats = used_stats + ${upgrAmnt} WHERE userId = "${message.author.id}"`);
                        await methods.removemoney(message.author.id, price);
                        await purchaseSkills(message, type.title, upgrAmnt);


                        const skillEmbed = new Discord.RichEmbed()
                        .setColor(14634070)
                        .setAuthor(message.member.displayName, message.author.avatarURL)
                        .setTitle(lang.upgrade[5].replace('{0}', upgrAmnt))
                        .setDescription(lang.upgrade[8].replace('{0}', (row.maxHealth + 5)))
                        .setFooter('Total upgrades: ' + (row.used_stats + 1))
                        botMessage.edit(skillEmbed);
                    }
                }
                else if(reaction.emoji.name === '💥'){
                    type = getType('strength');
                    
                    if(!await methods.hasmoney(message.author.id, price)){
                        botMessage.edit(lang.buy[4]);
                    }
                    else if(row.used_stats !== (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0].used_stats){
                        botMessage.edit('❌ Error: did your stats change while upgrading?');
                    }
                    else{
                        await query(`UPDATE scores SET used_stats = used_stats + ${upgrAmnt} WHERE userId = "${message.author.id}"`);
                        await methods.removemoney(message.author.id, price);
                        await purchaseSkills(message, type.title, upgrAmnt);


                        const skillEmbed = new Discord.RichEmbed()
                        .setColor(10036247)
                        .setAuthor(message.member.displayName, message.author.avatarURL)
                        .setTitle(lang.upgrade[6].replace('{0}', upgrAmnt))
                        .setDescription(lang.upgrade[9].replace('{0}', (row.scaledDamage + 0.03).toFixed(2)))
                        .setFooter('Total upgrades: ' + (row.used_stats + 1))
                        
                        botMessage.edit(skillEmbed);
                    }
                }
                else if(reaction.emoji.name === '🍀'){
                    type = getType('luck');
                    
                    if(!await methods.hasmoney(message.author.id, price)){
                        botMessage.edit(lang.buy[4]);
                    }
                    else if(row.used_stats !== (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0].used_stats){
                        botMessage.edit('❌ Error: did your stats change while upgrading?');
                    }
                    else{
                        await query(`UPDATE scores SET used_stats = used_stats + ${upgrAmnt} WHERE userId = "${message.author.id}"`);
                        await methods.removemoney(message.author.id, price);
                        await purchaseSkills(message, type.title, upgrAmnt);


                        const skillEmbed = new Discord.RichEmbed()
                        .setColor(5868887)
                        .setAuthor(message.member.displayName, message.author.avatarURL)
                        .setTitle(lang.upgrade[7].replace('{0}', upgrAmnt))
                        .setDescription(lang.upgrade[10])
                        .setFooter('Total upgrades: ' + (row.used_stats + 1))

                        botMessage.edit(skillEmbed);
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time!");
            }
        }
    },
}

async function purchaseSkills(message, type, amount){
    if(type == 'Health'){
        await query(`UPDATE scores SET maxHealth = maxHealth + ${(5 * amount)} WHERE userId = "${message.author.id}"`);
    }
    else if(type == 'Strength'){
        await query(`UPDATE scores SET scaledDamage = scaledDamage + ${(0.03 * amount).toFixed(2)} WHERE userId = "${message.author.id}"`);
    }
    else{
        // luck
        await query(`UPDATE scores SET luck = luck + ${(2 * amount)} WHERE userId = "${message.author.id}"`);
    }
}

function getType(type){
    if(type == 'health'){
        return {
            title: 'Health',
            display: '💗 Health',
            row: 'maxHealth'
        }
    }
    else if(type == 'strength'){
        return {
            title: 'Strength',
            display: '💥 Strength',
            row: 'scaledDamage'
        }
    }
    else if(type == 'luck'){
        return {
            title: 'Luck',
            display: '🍀 Luck',
            row: 'luck'
        }
    }
    else return ""
}

function nextLevel(type, row, amount){
    if(type.title == 'Health'){
        return row[type.row] + (5 * amount)
    }
    else if(type.title == 'Strength'){
        return (row[type.row] + (0.03 * amount)).toFixed(2) + 'x'
    }
    else if(type.title == 'Luck'){
        return row[type.row] + (2 * amount)
    }
}

function getPrice(used_stats, amount){
    let total_price = 0;
    let initial_start = used_stats;

    for(var i = 0; i < amount; i++){
        total_price += Math.floor((2**initial_start) * 1000)

        initial_start+= 1
    }

    return total_price;
}