const ITEMS_PER_PAGE = 10;

module.exports = {
    name: 'blackmarketlistings',
    aliases: ['bmlistings', 'bmlisting'],
    description: 'View your Black Market listings.',
    long: 'Show all listings on the Black Market that you own.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const listings = await app.query(`SELECT * FROM blackmarket WHERE sellerId = ${message.author.id}`);

        if(listings.length <= 10){
            return message.channel.createMessage(generatePages(app, message, listings)[0]);
        }
        
        app.react.paginate(message, generatePages(app, message, listings), 30000);
    },
}

function generatePages(app, message, listings){
    let maxPage = Math.ceil(listings.length / ITEMS_PER_PAGE) || 1;
    let pages = [];

    for(let i = 1; i < maxPage + 1; i++){
        let indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE;
        let indexLast = (ITEMS_PER_PAGE * i) - 1;
        let selectedListings = listings.slice(indexFirst, indexLast);
        
        const pageEmbed = new app.Embed()
        .setAuthor(message.author.username + "'s Listings", message.author.avatarURL)
        .setDescription('List more with `bmlist`\nRemove a listing with `bmremove <listing ID>`\n' + app.bm.createDisplay(selectedListings))
        .setColor(13215302)

        pages.push(pageEmbed);
    }

    return pages;
}