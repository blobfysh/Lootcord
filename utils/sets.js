//contains all banned user ids
var bannedUsers = new Set(); 

//add mods with t-admin modadd command
var moddedUsers = new Set();

//hourly command
var hourlyCooldown = new Set();

//vote command cooldown
var voteCooldown = new Set();

//deactivate command cooldown
var deactivateCooldown = new Set();
var activateCooldown = new Set();

//delete command cooldown
var deleteCooldown = new Set();

//trivia command cooldown
var triviaUserCooldown = new Set();

//scramble command cooldown
var scrambleCooldown = new Set();

//Set of users playing scramble to prevent level-up message
var activeScramblers = new Set();

//jackpot command
var jackpotServers = new Set(); // (servers currently using the command)
var jackpotCooldown = new Set();

//gamble(blackjack) command cooldown
var gambleCooldown = new Set();

//slots command cooldown
var slotsCooldown = new Set();

//roulette command cooldown
var rouletteCooldown = new Set();

//coinflip command cooldown
var cfCooldown = new Set();

//xp_potion use command cooldown
var xpPotCooldown = new Set();

// claimdrop command cooldown
var airdropCooldown = new Set();

//event cooldown for special event commands
var eventCooldown = new Set();

//healing item use command cooldown
var healCooldown = new Set();

//users under the effects of peck_seed
var peckCooldown = new Set();

var messageSpamCooldown = new Set(); //spam prevention on messages sent to mods
var lvlMsgSpamCooldown = new Set(); //spam prevention on gaining xp from chatting
var spamCooldown = new Set(); //cooldown on commands as a whole

var activeShield = new Set(); //users with shield

var weapCooldown = new Set(); //attack cooldown

// Clan cooldowns
var raided = new Set();
var raidCooldown = new Set();

const adminUsers = new Set(['168958344361541633', '221087115893669889', '246828746789617665']);

module.exports = {
    bannedUsers,
    moddedUsers,
    hourlyCooldown,
    voteCooldown,
    deactivateCooldown,
    deleteCooldown,
    activateCooldown,
    triviaUserCooldown,
    scrambleCooldown,
    activeScramblers,
    jackpotServers,
    jackpotCooldown,
    gambleCooldown,
    slotsCooldown,
    rouletteCooldown,
    cfCooldown,
    xpPotCooldown,
    airdropCooldown,
    eventCooldown,
    healCooldown,
    peckCooldown,
    messageSpamCooldown,
    lvlMsgSpamCooldown,
    spamCooldown,
    activeShield,
    weapCooldown,
    raided,
    raidCooldown,
    adminUsers
}