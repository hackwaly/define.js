define(function (require){
    var lazyConst = require('common/function/lazyConst');
    var test_CANVAS = require('common/browser/support/test_CANVAS');
    return lazyConst(function (){
        if (test_CANVAS()) {
            var canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            return !!(canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl'));
        }
        return false;
    });
});
