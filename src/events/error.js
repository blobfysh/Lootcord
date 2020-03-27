exports.run = function(error, id){
    console.error(require('util').inspect(error));
    this.cache.incr('errors');
}