define(function (require){
    var domKey = require('common/css/_domKey');
    return function (key){
        return !!domKey(key);
    };
});
