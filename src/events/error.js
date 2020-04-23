exports.run = function(error, id){
    console.error(error);
    this.cache.incr('errors');

    const errEmbed = new this.Embed()
    .setTitle('API Error')
    .setColor(16734296)
    .setDescription('```js\n' + error + '```')
    .setTimestamp()
    this.messager.messageLogs(errEmbed);
}