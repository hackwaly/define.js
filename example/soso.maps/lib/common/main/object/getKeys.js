define(function (require){
    var for_in = require('common/object/forIn');
    var keys = Object.prototype.keys;
    return keys ? function (obj){
        return keys.apply(obj);
    } : function (obj){
        var ret = [];
        for_in(obj, function (value, key){
            ret.push(key);
        });
        return ret;
    };
});
