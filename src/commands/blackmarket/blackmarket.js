
module.exports = {
    name: 'blackmarket',
    aliases: ['bm'],
    description: 'Search for Black Market listings by other players.',
    long: 'Search the Black Market for item listings.\n\nThe Black Market is a shop where players can list their own items for their own price and anyone can buy them using the `buy` command. You can also search the black market here: https://lootcord.com/blackmarket',
    args: {"item": "Item to search for."},
    examples: ["blackmarket rpg"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let item = app.parse.items(message.args)[0];

        if(!item){
            const listings = await app.query(`SELECT * FROM blackmarket ORDER BY RAND() LIMIT 10`);

            const embed = new app.Embed()
            .setTitle('🛒 Random Black Market Listings')
            .setDescription('These listings were made by other players!\n\nPurchase one with `buy <Listing ID>` command (ex. `t-buy Jq0cG_YY`)\n\n**Search for items with `bm <item to search>`**' + app.bm.createDisplay(listings))
            .setColor(13215302)

            message.channel.createMessage(embed);
        }
        else{
            const listings = await app.query(`SELECT * FROM blackmarket WHERE itemName LIKE ? ORDER BY pricePer ASC LIMIT 25`, ['%' + item + '%']);

            const embed = new app.Embed()
            .setTitle('🛒 Black Market Listings for: ' + item)
            .setDescription('These listings were made by other players!\n\nPurchase one with `buy <Listing ID>` command (ex. `t-buy Jq0cG_YY`)\n\n**Sorted lowest price to highest:**' + app.bm.createDisplay(listings))
            .setColor(13215302)

            message.channel.createMessage(embed);
        }
    },
}