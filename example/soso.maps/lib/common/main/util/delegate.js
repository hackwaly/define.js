define(function (require){
    var getUid = require('common/object/getUid');
    var hop = require('common/object/hop');

    function addCallback(callback){
        this.__callbackMap_[getUid(callback)] = callback;
        return this;
    }
    function removeCallback(callback){
        delete this.__callbackMap_[getUid(callback)];
        return this;
    }
    return function (){
        function d(){
            var map = d.__callbackMap_;
            var ret;
            var callbacks = [];
            for (var k in map) {
                if (hop(map, k)) {
                    callbacks.push(map[k]);
                }
            }
            for (var j = callbacks.length; j--;) {
                var r = callbacks[j].apply(this, arguments);
                if (r !== undefined) {
                    ret = r;
                }
            }
            return ret;
        }
        d.__callbackMap_ = {};
        d.addCallback = addCallback;
        d.removeCallback = removeCallback;
        return d;
    };
});
