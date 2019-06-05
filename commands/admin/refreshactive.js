// Disables the jackpot command to prevent users from losing money when the bot restarts/updates
const refresh = require('../../methods/refresh_active_role.js');

module.exports = {
    name: 'refreshactive',
    aliases: [''],
    description: 'Admin-only command. Refreshes active role in official server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        refresh.refreshactives(message);
    },
}