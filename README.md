<div>
  <p align="center">
    <a href="https://discordapp.com/oauth2/authorize?client_id=493316754689359874&permissions=388160&scope=bot"><img src="https://cdn.discordapp.com/attachments/497302646521069570/764344112299507763/lootcord_icon_transparent_small.png"/></a>
  </p>
  <h1 align="center">
    Lootcord
  </h1>
  <p align="center">
    <a href="https://discordbots.org/bot/493316754689359874"><img src="https://discordbots.org/api/widget/upvotes/493316754689359874.svg"/></a>
    <a href="https://discordbots.org/bot/493316754689359874"><img src="https://discordbots.org/api/widget/servers/493316754689359874.svg"/></a>
  </p>
  <h3 align="center"><strong>Collect items and battle your friends!</strong></h3>
</div>

## About
Website: https://lootcord.com<br>
Invite: https://discord.com/oauth2/authorize?client_id=493316754689359874&permissions=388160&scope=bot%20applications.commands<br>
Discord Server: https://discord.gg/apKSxuE<br>

## Commands
Commands can be found [here](https://lootcord.com/commands).

## Self-hosting when?

### I will not help you set up self-hosting, do not message me asking.

⚠️ If you plan to make your own version of the bot and submit it to bot lists, I am okay with that **AS LONG AS YOU MAKE SIGNIFICANT CHANGES**. Don't just copy paste the project and publish it as your own. For example, changing all of the items or giving the bot a whole new theme are significant changes. **AS PER THE LICENSE, YOU ARE REQUIRED TO MAKE THE SOURCE CODE AVAILABLE**. Also credit would be nice :)

Requirements:

- Node.js 10.x or 12.x
- MySQL or MariaDB
- Redis (tested on Windows using Memurai)

Create a .env file with your secrets (you can refer to the .env.example for what is needed), then create a database with the same name you specified in your .env file.

Install dependencies:
```javascript
npm install
```
Run SQL migrations (creates database schema):
```
npm run migrate:up
```
Start bot:
```
npm start
```

Custom icons will not show for you, you can change those in `icons.json`.

## Contributing


Feel free to contribute! Check the issues tab to see what needs to be worked on. If you're planning on fixing a bug, make sure an issue was created first so I can verify that the bug exists.

You can run:
```
npm run test
```
to make sure your code follows the project style and passes the tests
