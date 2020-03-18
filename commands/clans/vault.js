const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'vault',
    aliases: ['inv', 'v'],
    description: 'Show the items in a clans vault.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        const mentionedUser = message.mentions.users.first();

        if(!args.length && scoreRow.clanId == 0){
            return message.reply(lang.clans.info[0]);
        }
        else if(!args.length){
            getVaultInfo(message, lang, scoreRow.clanId);
        }
        else if(mentionedUser !== undefined){
            const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${mentionedUser.id}`))[0];
            if(!invitedScoreRow){
                return message.reply(lang.errors[0]);
            }
            else if(invitedScoreRow.clanId == 0){
                return message.reply(lang.clans.errors[1]);
            }
            else{
                getVaultInfo(message, lang, invitedScoreRow.clanId);
            }
        }
        else{
            var clanName = args.join(" ");
            const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply(lang.clans.info[1]);
            }
            
            getVaultInfo(message, lang, clanRow[0].clanId);
        }
    },
}

async function getVaultInfo(message, lang, clanId){
    const clanRow = (await query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    //const clanMembers = await clans.getMembers(clanId);
    //const clanPower = await clans.getPower(clanId);
    const clanItems = await methods.getuseritems(clanId, {amounts: true, countBanners: true, sep: '`', icon: true});

    var ultraItemList    = clanItems.ultra;
    var legendItemList   = clanItems.legendary;
    var epicItemList     = clanItems.epic;
    var rareItemList     = clanItems.rare;
    var uncommonItemList = clanItems.uncommon;
    var commonItemList   = clanItems.common;
    var limitedItemList  = clanItems.limited;

    const embedInfo = new Discord.RichEmbed()
    .setColor(13215302)
    .setTitle(clanRow.name + ' Vault')
    .setDescription(clanRow.status !== '' ? clanRow.status : lang.clans.info[2])
    .setThumbnail(clanRow.iconURL)
    if(ultraItemList != ""){
        let newList = ultraItemList.join('\n');
        embedInfo.addField("Ultra", newList, true);
    }
    
    if(legendItemList != ""){
        let newList = legendItemList.join('\n');
        embedInfo.addField("Legendary", newList, true);
    }
    
    if(epicItemList != ""){
        let newList = epicItemList.join('\n');
        embedInfo.addField("Epic", newList, true);
    }
    
    if(rareItemList != ""){
        let newList = rareItemList.join('\n');
        embedInfo.addField("Rare", newList, true);
    }
    
    if(uncommonItemList != ""){
        let newList = uncommonItemList.join('\n');
        embedInfo.addField("Uncommon", newList, true);
    }
    
    if(commonItemList != ""){
        let newList = commonItemList.join('\n');
        embedInfo.addField("Common", newList, true);
    }
    
    if(limitedItemList != ""){
        let newList = limitedItemList.join('\n');
        embedInfo.addField("Limited", newList, true);
    }
    
    if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
        embedInfo.addField(lang.clans.vault[0], "\u200b");
    }

    embedInfo.addField("\u200b", `Power(slots) used: ${clanItems.itemCount} | Vault value: ${methods.formatMoney(clanItems.invValue, true)}`)

    message.channel.send(embedInfo);
}