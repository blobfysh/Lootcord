const config = require('../json/_config.json');
const { query } = require('../mysql.js');
const Discord = require('discord.js');

exports.checkIfPatron = async function(oldMember, newMember) {
    if(newMember.guild.id !== config.supportGuildID){
        return;
    }

    if(!oldMember.roles.has(config.tier1PatronRoleID) && newMember.roles.has(config.tier1PatronRoleID)){
        // just gained patron tier 1
        query(`INSERT IGNORE INTO patrons (userId, tier) VALUES (${newMember.id}, 1)`);
        newMember.send(makePatronEmbed());
        console.log('someone gained patron tier 1.');
    }
    
    else if(oldMember.roles.has(config.tier1PatronRoleID) && !newMember.roles.has(config.tier1PatronRoleID)){
        // just lost patron
        query(`DELETE FROM patrons WHERE userId = ${newMember.id}`);
        console.log('someone lost patron.');
    }
}

exports.refreshPatrons = async function(manager){
    var patronArr = await manager.broadcastEval(`
        const patreonGuild = this.guilds.get('${config.supportGuildID}');

        if(patreonGuild){
            patreonGuild.roles.get('${config.tier1PatronRoleID}').members.map(m => m.user.id);
        }
    `);
    const currPatrons = await query(`SELECT * FROM patrons`);

    patronArr = patronArr[0];

    var patronsAdded   = 0;
    var patronsRemoved = 0;

    // Adds patrons if they had role added while bot was offline.
    for(var i = 0; i < patronArr.length; i++){
        const isPatronDB = await query(`SELECT * FROM patrons WHERE userId = ${patronArr[i]}`);

        if(!isPatronDB.length){
            patronsAdded++;
            query(`INSERT IGNORE INTO patrons (userId, tier) VALUES (${patronArr[i]}, 1)`);
        }
    }

    // Removes patrons if they had their role removed while bot was offline.
    currPatrons.forEach(patronUser => {
        if(!patronArr.includes(patronUser.userId)){
            patronsRemoved++;
            query(`DELETE FROM patrons WHERE userId = ${patronUser.userId}`);
        }
    });

    console.log(patronsAdded + ' patrons added!\n' + patronsRemoved + ' patrons removed!');

    return {
        patronsAdded: patronsAdded,
        patronsRemoved: patronsRemoved
    }
}

function makePatronEmbed(){
    const patronEmbed = new Discord.RichEmbed()
    .setTitle('😲 a new patron!')
    .setDescription('Thank you for helping me create this awesome bot!!\nIf you need any help don\'t hesitate to ask me!')
    .setFooter('💙 blobfysh')
    .setColor(16345172)

    return patronEmbed;
}