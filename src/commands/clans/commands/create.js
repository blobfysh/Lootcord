const Filter = require('bad-words');
const filter = new Filter();
const CREATION_COST = 25000;

module.exports = {
    name: 'create',
    aliases: [''],
    description: 'Create a clan.',
    long: 'Create a clan.',
    args: {"name": "Desired name of your clan."},
    examples: ["clan info mod squad"],
    requiresClan: false,
    minimumRank: 0,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        let clanName = args.join(" ");

        if(!args.length){
            return message.reply('Please specify a clan tag.');
        }
        else if(scoreRow.clanId !== 0){
            return message.reply('❌ You are already in a clan!');
        }
        else if(!/^[a-zA-Z0-9 ]+$/.test(clanName)){
            return message.reply('❌ Special characters are not supported in clan tags. Supported: Alphanumeric characters and space');
        }
        else if(clanName.length < 4 || clanName.length > 20){
            return message.reply(`Clan tags must be atleast 4 characters long up to a max of 20 characters. The one you entered is ${clanName.length} characters.`);
        }
        else if(filter.isProfane(clanName)){
            return message.reply('❌ The clan tag you are trying to use contains innappropiate language. **Vulgar clan tags will not be tolerated.**');
        }

        const clanRow = (await app.query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));
        
        if(clanRow.length){
            return message.reply('❌ A clan with that tag already exists!');
        }
        else if(scoreRow.money < CREATION_COST){
            return message.reply(`❌ You need atleast ${app.common.formatNumber(CREATION_COST)} to create a clan! You only have ${app.common.formatNumber(scoreRow.money)}.\n\nCome back when you've racked up some more money...`);
        }

        const botMessage = await message.channel.createMessage(`**📤 Cost: ${app.common.formatNumber(CREATION_COST)}**\n\nCreate clan with the tag: \`${clanName}\`?`);

        try{
            const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

            if(confirmed){
                const scoreRow2 = (await app.query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
                const clanRow2 = (await app.query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

                if(scoreRow2.clanId !== 0){
                    return message.reply('❌ You are already in a clan!');
                }
                else if(scoreRow2.money < CREATION_COST){
                    return message.reply(`❌ You need atleast ${app.common.formatNumber(CREATION_COST)} to create a clan! You only have ${app.common.formatNumber(scoreRow2.money)}.\n\nCome back when you've racked up some more money...`);
                }
                else if(clanRow2.length){
                    return message.reply('❌ A clan with that tag already exists!');
                }
                
                await app.player.removeMoney(message.author.id, CREATION_COST);
                createClan(app, clanName, message.author.id);
                message.reply(`Congratulations! You are now the proud leader of the \`${clanName}\` clan!\n\nView your clan information with \`${message.prefix}clan info\` and check the vault with \`${message.prefix}clan vault\`.`);
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit("You didn't react in time.");
        }
    },
}

async function createClan(app, clanTag, clanOwner){
    const clanRow = await app.query(insertClanSQL, [clanTag, clanOwner, (new Date()).getTime()]);
    const clanID = (await app.query(`SELECT clanId FROM clans WHERE ownerId = ${clanOwner}`))[0].clanId;

    await app.query(`UPDATE scores SET clanId = ${clanID} WHERE userId = ${clanOwner}`);
    await app.query(`UPDATE scores SET clanRank = 4 WHERE userId = ${clanOwner}`);
}

const insertClanSQL = `
INSERT IGNORE INTO clans (
    name,
    ownerId,
    money,
    status,
    iconURL,
    clanCreated,
    clanViews,
    raidTime)
    VALUES (
        ?, ?,
        0, '', '',
        ?, 0, 0
    )
`