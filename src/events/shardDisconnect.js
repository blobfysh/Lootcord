exports.run = function(error, id){
    console.error('Shard ' + id + ' disconnected');
    this.cache.incr('shards_disconnected');
}