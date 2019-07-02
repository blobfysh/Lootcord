const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
const itemdata = require('../../json/completeItemList.json');

module.exports = {
    name: 'raid',
    aliases: [''],
    description: 'Raid another clan.',
    minimumRank: 0,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];

        if(scoreRow.clanId == 0){
            return message.reply(lang.clans.leave[0]);
        }
        else if(!args.length){
            return message.reply(lang.clans.raid[0]);
        }
        else if(message.client.sets.raidCooldown.has(scoreRow.clanId.toString())){
            return message.reply(lang.clans.raid[2].replace('{0}', convertToTime((3600 * 1000 - ((new Date()).getTime() - (await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0].raidTime)))));
        }
        else{
            var clanName = args.join(" ");
            const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply(lang.clans.info[1]);
            }
            else if(clanRow[0].clanId == scoreRow.clanId){
                return message.reply(lang.clans.raid[1]);
            }
            else if(message.client.sets.raided.has(clanRow[0].clanId.toString())){
                return message.reply(lang.clas.raid[3]);
            }

            const clanPower = await clans.getClanData(clanRow[0].clanId);
            const isRaidable = clanPower.usedPower > clanPower.currPower ? true : false;
            const itemsToSteal = clanPower.usedPower - clanPower.currPower;

            var raidEmbed = new Discord.RichEmbed()
            .setAuthor(message.author.username + ' | ' + (await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0].name, message.author.avatarURL)
            .setDescription(lang.clans.raid[4].replace('{0}', clanRow[0].name))
            .setTitle(lang.clans.raid[5])

            const botmsg = await message.channel.send(raidEmbed);

            setTimeout(() => {
                if(isRaidable){
                    raidEmbed.setDescription(lang.clans.raid[6].replace('{0}', itemsToSteal).replace('{1}', prefix).replace('{2}', clanRow[0].name));
                    raidEmbed.setTitle('');
                    raidEmbed.setFooter(lang.clans.raid[7])
                    raidEmbed.setColor(8311585);
                }
                else{
                    raidEmbed.setDescription(lang.clans.raid[8].replace('{0}', clanRow[0].name).replace('{1}', clanPower.currPower).replace('{2}', clanPower.usedPower));
                    raidEmbed.setTitle('');
                    raidEmbed.setColor(15083840);
                }
                

                botmsg.edit(raidEmbed);
            }, 2000);

            if(!isRaidable){
                return
            }

            var moneyStolen = Math.floor(clanRow[0].money / 3);
            var itemsStolen = 0;
            var itemsArray = [];

            message.client.shard.broadcastEval(`this.sets.raided.add('${clanRow[0].clanId}')`);

            message.client.shard.broadcastEval(`this.sets.raidCooldown.add('${scoreRow.clanId}')`);
            query(`UPDATE clans SET raidTime = ${new Date().getTime()} WHERE clanId = ${scoreRow.clanId}`);
            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.raidCooldown.delete('${scoreRow.clanId}')`);
                query(`UPDATE clans SET raidTime = ${0} WHERE clanId = ${scoreRow.clanId}`);
            }, 3600 * 1000);

            await clans.removeMoney(clanRow[0].clanId, moneyStolen);
            await clans.addMoney(scoreRow.clanId, moneyStolen);

            const collector = new Discord.MessageCollector(message.channel, m => {
                return m.author.id == message.author.id
            }, { time: 120000 });

            collector.on("collect", async response => {
                const userArgs = response.content.split(/ +/);
                const item = methods.getCorrectedItemInfo(userArgs[0]);
                var itemAmnt = userArgs[1];

                if(itemdata[item] !== undefined){
                    if(itemAmnt == undefined){
                        itemAmnt = 1;
                    }
                    else if(!Number.isInteger(parseInt(itemAmnt)) || itemAmnt % 1 !== 0 || itemAmnt < 1){
                        return;
                    }
                    else if(parseInt(itemAmnt) + itemsStolen > itemsToSteal){
                        return response.reply(lang.clans.raid[9].replace('{0}', (itemsToSteal - itemsStolen)))
                    }

                    if(await methods.hasitems(clanRow[0].clanId, item, itemAmnt)){
                        await methods.removeitem(clanRow[0].clanId, item, itemAmnt);
                        await methods.additem(scoreRow.clanId, item, itemAmnt);

                        response.reply(lang.clans.raid[10].replace('{0}', itemAmnt).replace('{1}', item).replace('{2}', (itemsToSteal - (itemAmnt + itemsStolen))));
                        itemsArray.push(item + '|' + itemAmnt);
                        itemsStolen += itemAmnt;

                        if(itemsToSteal - itemsStolen <= 0){
                            const raidEmbed = new Discord.RichEmbed()
                            .setAuthor(message.author.username + ' | ' + (await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0].name, message.author.avatarURL)
                            .setTitle(lang.clans.raid[16].replace('{0}', methods.formatMoney(moneyStolen)))
                            .addField(lang.clans.raid[11], '```' + getItemsDisplay(itemsArray).join('\n') + '```')
                            .setColor(8311585)
                            .setFooter(lang.clans.raid[12])
                            
                            response.reply(lang.clans.raid[13], {embed: raidEmbed});
                            collector.stop();
                        }
                    }
                    else{
                        return response.reply(lang.clans.raid[15]);
                    }
                }
                else if(item == 'stop' || item == 'done'){
                    const raidEmbed = new Discord.RichEmbed()
                    .setAuthor(message.author.username + ' | ' + (await query(`SELECT * FROM clans WHERE clanId = ${scoreRow.clanId}`))[0].name, message.author.avatarURL)
                    .setTitle(lang.clans.raid[16].replace('{0}', methods.formatMoney(moneyStolen)))
                    .addField(lang.clans.raid[11], '```' + getItemsDisplay(itemsArray).join('\n') + '```')
                    .setColor(8311585)
                    .setFooter(lang.clans.raid[12])
                    
                    response.reply(lang.clans.raid[14], {embed: raidEmbed});
                    collector.stop();
                }
            });
            collector.on("end", response => {
                message.client.shard.broadcastEval(`this.sets.raided.delete('${clanRow[0].clanId}')`);
            });
            
        }
    },
}

function getItemsDisplay(itemArr){
    var nameArr = [];
    var amountArr = [];
    var finalArr = [];

    for(var i = 0; i < itemArr.length; i++){
        var item = itemArr[i].split('|');

        var nameArrIndex = nameArr.indexOf(item[0]);

        if(nameArrIndex !== -1){
            amountArr[nameArrIndex] = parseInt(amountArr[nameArrIndex]) + parseInt(item[1]);
        }
        else{
            nameArr.push(item[0]);
            amountArr.push(item[1]);
        }
    }

    for(var i = 0; i < nameArr.length; i++){
        finalArr.push(amountArr[i] + 'x ' + nameArr[i]);
    }

    return finalArr.length > 0 ? finalArr : ['Nothing...'];
}

function convertToTime(ms){
    var seconds = (ms / 1000).toFixed(1);

    var minutes = (ms / (1000 * 60)).toFixed(1);

    var hours = (ms / (1000 * 60 * 60)).toFixed(1);

    var days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);

    if (seconds < 60) {
        return seconds + " seconds";
    } 
    else if (minutes < 60) {
        return minutes + " minutes";
    } 
    else if (hours < 24) {
        return hours + " hours";
    }
    else {
        return days + " days"
    }
}