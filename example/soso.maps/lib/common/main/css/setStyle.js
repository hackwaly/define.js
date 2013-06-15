define(function (require){
    var domKey = require('common/css/_domKey');
    return function (elm, key, value){
        value = typeof value === 'number' ?
            value + 'px' : value;
        elm.style[domKey(key)] = value;
    };
});
