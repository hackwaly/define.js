define(function (require){
    var requestAnimationFrame = require('common/render/requestAnimationFrame');
    var cancelRequestAnimationFrame = require('common/render/cancelRequestAnimationFrame');
    var timeStamp = require('common/date/timeStamp');
    var GECKO = require('common/browser/GECKO');

    if (GECKO) {
        requestAnimationFrame = null;
    }

    var INTERVAL = 16;
    return function (callback){
        var renderRequested = false;
        var frame = function (){
            if (callback() === false) {
                clearInterval(timer);
            }
            renderRequested = false;
        };
        var timer = setInterval(function (){
            if (requestAnimationFrame) {
                if (!renderRequested) {
                    renderRequested = true;
                    requestAnimationFrame(frame);
                }
            } else {
                frame();
            }
        }, INTERVAL);
    };
});
