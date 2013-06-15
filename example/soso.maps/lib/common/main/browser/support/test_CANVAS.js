define(function (require){
    var lazyConst = require('common/function/lazyConst');
    return lazyConst(function (){
        var canvas = document.createElement('canvas');
        return !!canvas.getContext;
    });
});
