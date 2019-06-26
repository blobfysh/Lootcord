const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const methods = require('../../methods/methods.js');
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'vault',
    aliases: ['inv'],
    description: 'Show the items in a clans vault.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        const mentionedUser = message.mentions.users.first();

        if(!args.length && scoreRow.clanId == 0){
            return message.reply('You are not a member of any clan! You can look up other clans by searching their name.');
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
                return message.reply('That user is not in a clan.');
            }
            else{
                getVaultInfo(message, lang, invitedScoreRow.clanId);
            }
        }
        else{
            var clanName = args.join(" ");
            const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

            if(!clanRow.length){
                return message.reply('I could not find a clan with that name! Maybe you misspelled it?');
            }
            
            getVaultInfo(message, lang, clanRow[0].clanId);
        }
    },
}

async function getVaultInfo(message, lang, clanId){
    const clanRow = (await query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    //const clanMembers = await clans.getMembers(clanId);
    //const clanPower = await clans.getPower(clanId);
    const clanItems = await methods.getuseritems(clanId, {amounts: true});

    var ultraItemList    = clanItems.ultra;
    var legendItemList   = clanItems.legendary;
    var epicItemList     = clanItems.epic;
    var rareItemList     = clanItems.rare;
    var uncommonItemList = clanItems.uncommon;
    var commonItemList   = clanItems.common;
    var limitedItemList  = clanItems.limited;

    const embedInfo = new Discord.RichEmbed()
    .setColor(14202368)
    .setTitle(clanRow.name + ' VAULT')
    .setDescription(clanRow.status !== '' ? clanRow.status : 'This clan is too mysterious for a status...')
    .setThumbnail(clanRow.iconURL)
    if(ultraItemList != ""){
        let newList = ultraItemList.join('\n');
        embedInfo.addField("<:UnboxUltra:526248982691840003> Ultra", "```" + newList + "```", true);
    }
    
    if(legendItemList != ""){
        let newList = legendItemList.join('\n');
        embedInfo.addField("<:UnboxLegendary:526248970914234368> Legendary", "```" + newList + "```", true);
    }
    
    if(epicItemList != ""){
        let newList = epicItemList.join('\n');
        embedInfo.addField("<:UnboxEpic:526248961892155402> Epic", "```" + newList + "```", true);
    }
    
    if(rareItemList != ""){
        let newList = rareItemList.join('\n');
        embedInfo.addField("<:UnboxRare:526248948579434496> Rare", "```" + newList + "```", true);
    }
    
    if(uncommonItemList != ""){
        let newList = uncommonItemList.join('\n');
        embedInfo.addField("<:UnboxUncommon:526248928891371520> Uncommon", "```" + newList + "```", true);
    }
    
    if(commonItemList != ""){
        let newList = commonItemList.join('\n');
        embedInfo.addField("<:UnboxCommon:526248905676029968> Common", "```" + newList + "```", true);
    }
    
    if(limitedItemList != ""){
        let newList = limitedItemList.join('\n');
        embedInfo.addField("🎁Limited", "```" + newList + "```", true);
    }
    
    if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
        embedInfo.addField(lang.inventory[3], "\u200b");
    }

    message.channel.send(embedInfo);
}