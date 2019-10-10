/*
* 5/2/2019
*
* This file is a bit experimental, it's the first time I've tried creating my own API
* Will be used for the website to retrieve the global leaderboard.
*
*/

const Discord    = require('discord.js');
const client     = new Discord.Client({
    messageCacheMaxSize: 50,
    messageCacheLifetime: 300,
    messageSweepInterval: 500,
    disableEveryone: true,
    disabledEvents: [
        'PRESENCE_UPDATE',
        'VOICE_STATE_UPDATE',
        'TYPING_START'
    ]
});
const express    = require('express');
const bodyParser = require('body-parser');
const config     = require('../json/_config.json');
const globalLB   = require('../methods/global_leaderboard.js');
const patrons    = require('../methods/patron_list.js');
const { query }  = require('../mysql.js');
const app        = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

client.on('ready', () => {
    app.post('/api/leaderboard', async (req, res) => {
        if(!req.body.apiAuth){
            return res.status(400).send('Missing authorization!');
        }
        else if(req.body.apiAuth !== config.lootcordAPIAuth){
            return res.status(400).send('Invalid authorization!');
        }
        else{
            const leaders = await globalLB.create_lb(client);
            res.status(200).send(leaders.leadersOBJ);
        }
    });

    app.post('/api/patrons', async (req, res) => {
        if(!req.body.apiAuth){
            return res.status(400).send('Missing authorization!');
        }
        else if(req.body.apiAuth !== config.lootcordAPIAuth){
            return res.status(400).send('Invalid authorization!');
        }
        else{
            const patronList = await patrons.list_patrons(client);
            res.status(200).send(patronList.patronJSON);
        }
    });
    
    app.post('/api/searchbm', async (req, res) => {
        if(!req.body.apiAuth){
            return res.status(400).send('Missing authorization!');
        }
        else if(req.body.apiAuth !== config.lootcordAPIAuth){
            return res.status(400).send('Invalid authorization!');
        }
        else{
            const listings = await query(`SELECT * FROM blackmarket WHERE itemName LIKE ? ORDER BY pricePer ASC LIMIT 50`, ['%' + req.body.input + '%']);
            res.status(200).send(listings);
        }
    });

    /* 
    *  This DOES work for receiving dbl votes without use of the dblapi.js library,
    *  may switch to this in the future but for now I'm going to keep the vote handling in a separate file.
    * 
    app.post(config.dblWebhookPath, async (req, res) => {
        if(req.headers.authorization == config.dblAuth){
            
            try{
                const voter = await client.users.get(req.body.user);

                voter.send('Nice I received a vote from ' + req.body.user);
            }
            catch(err){
                console.log('ERROR GETTING USER: ' + err);
            }

            res.status(200).send('Successfully received vote!');
        }
        else{
            res.status(400).send('Could not authorize vote.');
        }
    });
    */

    app.listen(5001, () => {
        console.log(`[API] API running on port 5001`);
    });
});

client.on('error', (err) => {
    console.log('[API] Error with Discord connection: ' + err);
});

client.on('disconnect', (err) => {
    console.log(err);
    client.destroy().then(client.login(config.botToken));
});

client.login(config.botToken);