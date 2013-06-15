define(function (require){
    var Animation = require('common/fx/Animation');
    var setStyle = require('common/css/setStyle');
    var LINEAR = require('common/fx/tween/LINEAR');
    return function (elm, time, inOrOut){
        var anim = new Animation();
        anim.setBeginValues([inOrOut ? 0 : 1]);
        anim.setEndValues([inOrOut ? 1 : 0]);
        anim.setTween(LINEAR);
        anim.setDuration(time);
        anim.setApplier(function (values){
            setStyle(elm, 'opacity', values[0] + '');
        });
        function end(display){
            setStyle(elm, 'opacity', '');
            setStyle(elm, 'display', !display ? 'none' : '');
        }
        anim.onStart.addCallback(function (){
            end(!inOrOut);
        });
        anim.onEnd.addCallback(function (){
            end(inOrOut);
            elm = null;
        });
        anim.start();
    };
});
