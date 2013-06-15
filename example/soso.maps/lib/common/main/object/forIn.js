define(function (require){
    var hop = require('common/object/hop');
    var filter = require('common/array/filter');
    var omitKeys = filter([
        'constructor',
        'toString',
        'valueOf',
        'toLocaleString',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'hasOwnProperty'], function (key){
            var testObj = {};
            testObj[key] = key;
            for (var k in testObj) {
                if (k === key) {
                    return false;
                }
            }
            return true;
        });
    return function (obj, fn, thisp){
        var k;
        for (k in obj) {
            if (hop(obj, k)) {
                if (fn.call(thisp, obj[k], k, obj) === false) {
                    return false;
                }
            }
        }
        for (var j=omitKeys.length; j--;) {
            k = omitKeys[j];
            if (hop(obj, k)) {
                if (fn.call(thisp, obj[k], k, obj) === false) {
                    return false;
                }
            }
        }
    };
});
