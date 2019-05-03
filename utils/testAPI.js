/*
* 5/2/2019
*
* This file is a bit experimental, it's the first time I've tried creating my own API
* Will be used for the website to retrieve the global leaderboard.
*
*/

const Discord    = require('discord.js');
const client     = new Discord.Client();
const express    = require('express');
const bodyParser = require('body-parser');
const config     = require('../json/_config.json');
const globalLB   = require('../methods/global_leaderboard.js');
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
        console.log(`API running on port 5001`);
    });
});

client.on('error', (err) => {
    console.log('Error with Discord connection in the API: ' + err);
});

client.login(config.botToken);