define(function (require){
    var domKey = require('common/css/_domKey');
    return function (elm, key){
        return elm.style[domKey(key)] || null;
    };
});
