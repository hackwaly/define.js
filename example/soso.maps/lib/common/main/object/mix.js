define(function (require){
    var hop = require('common/object/hop');
    return function (dest, src){
        for (var k in src) {
            if (hop(src, k)) {
                dest[k] = src[k];
            }
        }
        return dest;
    };
});
