define(function (require){
    var createObject = require('common/object/create');
    var use_proto = !!{}.__proto__;
    return function (c, b){
        var bp = b.prototype;
        c.$super = bp;
        if (use_proto) {
            c.prototype.__proto__ = bp;
        } else {
            c.prototype = createObject(bp);
            c.prototype.constructor = c;
        }
    };
});
