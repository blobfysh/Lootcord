const { ITEM_TYPES } = require('../../../resources/constants');

module.exports = {
    name: 'vault',
    aliases: ['inv', 'v'],
    description: 'Show the items in a clans vault.',
    long: 'Shows all items in a clans vault.',
    args: {"clan/user": "Clan or user to search, will default to your own clan if none specified."},
    examples: ["clan vault Mod Squad"],
    requiresClan: false,
    requiresActive: false,
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
    const clanRow = await app.clans.getRow(clanId);
    const clanItems = await app.itm.getUserItems(await app.itm.getItemObject(clanId));

    let weaponList = clanItems.weapons;
    let itemList = clanItems.usables;
    let ammoList = clanItems.ammo;
    let materialList = clanItems.materials;
    let storageList = clanItems.storage;

    const embedInfo = new app.Embed()
    .setColor(13451564)
    .setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
    .setTitle('Vault')
    
    if(clanRow.iconURL){
        embedInfo.setThumbnail(clanRow.iconURL)
    }

    // item fields
    if(weaponList.length){
        embedInfo.addField(ITEM_TYPES['weapons'].name, weaponList.join('\n'), true);
    }
    
    if(itemList.length){
        embedInfo.addField(ITEM_TYPES['items'].name, itemList.join('\n'), true);
    }
    
    if(ammoList.length){
        embedInfo.addField(ITEM_TYPES['ammo'].name, ammoList.join('\n'), true);
    }
    
    if(materialList.length){
        embedInfo.addField(ITEM_TYPES['materials'].name, materialList.join('\n'), true);
    }
    
    if(storageList.length){
        embedInfo.addField(ITEM_TYPES['storage'].name, storageList.join('\n'), true);
    }

    if(!weaponList.length && !itemList.length && !ammoList.length && !materialList.length && !storageList.length){
        embedInfo.addField('This vault is empty!', "\u200b");
    }

    embedInfo.addField("\u200b", `Power (slots) used: ${clanItems.itemCount} | Vault value: ${app.common.formatNumber(clanItems.invValue)}`)

    return embedInfo;
}