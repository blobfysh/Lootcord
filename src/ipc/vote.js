const voteHandler = require('../utils/voteHandler');

exports.run = function(msg){
    voteHandler.handle.bind(this);
}