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

client.on('ready', async () => {
    const leaders = await globalLB.create_lb(client);

    app.post('/api/leaderboard', (req, res) => {
        if(!req.body.apiAuth){
            return res.status(400).send('Missing authorization!');
        }
        else if(req.body.apiAuth !== config.lootcordAPIAuth){
            return res.status(400).send('Invalid authorization!');
        }
        else{
            res.status(200).send(leaders.leadersOBJ);
        }
    });

    app.listen(5001, () => {
        console.log(`API running on port 5001`);
    });
});

client.login(config.botToken);