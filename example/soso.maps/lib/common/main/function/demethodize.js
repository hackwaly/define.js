define(function (require){
    var _Function$call = Function.prototype.call;
    return function (fn){
        return function (){
            return _Function$call.apply(fn, arguments);
        };
    };
});
