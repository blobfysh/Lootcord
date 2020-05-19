
module.exports = {
    name: 'vault',
    aliases: ['inv', 'v'],
    description: 'Show the items in a clans vault.',
    long: 'Shows all items in a clans vault.',
    args: {"clan/user": "Clan or user to search, will default to your own clan if none specified."},
    examples: ["clan vault Mod Squad"],
    requiresClan: false,
    minimumRank: 0,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        const mentionedUser = app.parse.members(message, args)[0];

        if(!args.length && scoreRow.clanId == 0){
            return message.reply('You are not a member of any clan! You can look up other clans by searching their name.');
        }
        else if(!args.length){
            message.channel.createMessage(await getVaultInfo(app, scoreRow.clanId));
        }
        else if(mentionedUser !== undefined){
            const mentionedScoreRow = await app.player.getRow(mentionedUser.id);
            if(!mentionedScoreRow){
                return message.reply(`❌ The person you're trying to search doesn't have an account!`);
            }
            else if(mentionedScoreRow.clanId == 0){
                return message.reply('❌ That user is not in a clan.');
            }
            else{
                message.channel.createMessage(await getVaultInfo(app, mentionedScoreRow.clanId));
            }
        }
        else{
            let clanName = args.join(" ");
            const clanRow = await app.clans.searchClanRow(clanName);

            if(!clanRow){
                return message.reply('I could not find a clan with that name! Maybe you misspelled it?');
            }
            
            message.channel.createMessage(await getVaultInfo(app, clanRow.clanId));
        }
    },
}

async function getVaultInfo(app, clanId){
    const clanRow = (await app.query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    const clanItems = await app.itm.getUserItems(await app.itm.getItemObject(clanId));

    let ultraItemList    = clanItems.ultra;
    let legendItemList   = clanItems.legendary;
    let epicItemList     = clanItems.epic;
    let rareItemList     = clanItems.rare;
    let uncommonItemList = clanItems.uncommon;
    let commonItemList   = clanItems.common;
    let limitedItemList  = clanItems.limited;

    const embedInfo = new app.Embed()
    .setColor(13215302)
    .setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
    .setTitle('Vault')
    
    if(clanRow.iconURL){
        embedInfo.setThumbnail(clanRow.iconURL)
    }

    if(ultraItemList != ""){
        embedInfo.addField("Ultra", ultraItemList.join('\n'), true);
    }
    
    if(legendItemList != ""){
        embedInfo.addField("Legendary", legendItemList.join('\n'), true);
    }
    
    if(epicItemList != ""){
        embedInfo.addField("Epic", epicItemList.join('\n'), true);
    }
    
    if(rareItemList != ""){
        embedInfo.addField("Rare", rareItemList.join('\n'), true);
    }
    
    if(uncommonItemList != ""){
        embedInfo.addField("Uncommon", uncommonItemList.join('\n'), true);
    }
    
    if(commonItemList != ""){
        embedInfo.addField("Common", commonItemList.join('\n'), true);
    }
    
    if(limitedItemList != ""){
        embedInfo.addField("Limited", limitedItemList.join('\n'), true);
    }
    
    if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
        embedInfo.addField('The vault is empty!', "\u200b");
    }

    embedInfo.addField("\u200b", `Power (slots) used: ${clanItems.itemCount} | Vault value: ${app.common.formatNumber(clanItems.invValue)}`)

    return embedInfo;
}