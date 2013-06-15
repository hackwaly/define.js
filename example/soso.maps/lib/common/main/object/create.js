define(function (require){
    var t = function (){};
    return function (proto){
        if (!proto) {
            return {};
        }
        t.prototype = proto;
        var r = new t();
        t.prototype = null;
        return r;
    };
});
