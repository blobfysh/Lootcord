const kofiHandler = require('../utils/kofiHandler');

exports.run = function(msg){
    kofiHandler.handle.bind(this);
}