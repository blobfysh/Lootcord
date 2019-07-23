//const Discord = require('discord.js');
const config = require('../json/_config.json');
const { query } = require('../mysql.js');

exports.refreshactives = async function(message){
    try{
        var activeRole = message.guild.roles.get(message.guild.id).members.map(mem => mem.user.id);

        for(var i = 0; i < activeRole.length; i++){
            const active = await query(`SELECT * FROM userGuilds WHERE userId = ${activeRole[i]} AND guildId = ${message.guild.id}`);

            if(!active.length){
                message.guild.members.get(activeRole[i]).removeRole(config.activeRoleGuilds[message.guild.id].activeRoleID);
            }
        }
        const activeRow = await query(`SELECT * FROM userGuilds WHERE guildId = ${message.guild.id}`);

        activeRow.forEach(user => {
            if(!message.guild.members.get(user.userId).roles.find(r => r.id === config.activeRoleGuilds[message.guild.id].activeRoleID)){
                message.guild.members.get(user.userId).addRole(config.activeRoleGuilds[message.guild.id].activeRoleID);
            }
        });
    }
    catch(e){
        console.log(e);
    }
}