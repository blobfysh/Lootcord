
module.exports = {
    name: 'givepremium',
    aliases: [''],
    description: "Gives user Lootcord premium.",
    long: "Gives user Lootcord premium. Premium lowers spam cooldown to 1 second from 3 seconds and gives user a donator banner.",
    args: {
        "User ID": "ID of user to give premium perks.",
        "months": "Number of months of premium to give."
    },
    examples: ["givepremium 168958344361541633 2"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userID = message.args[0];
        let months = message.args[1];

        if(!userID){
            return message.reply('❌ You forgot to include a user ID.');
        }
        else if(!months){
            return message.reply('❌ You forgot to include the number of months.');
        }

        let donateObj = {
            message: userID,
            amount: months * 3
        }

        app.ipc.sendTo(0, 'donation', {data: JSON.stringify(donateObj)});

        message.reply('✅ Sent donation request.');
    },
}