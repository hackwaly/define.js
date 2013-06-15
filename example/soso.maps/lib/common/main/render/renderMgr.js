define(function (require){
    var renderLoop = require('common/render/renderLoop');
    var timeStamp = require('common/date/timeStamp');
    var delegate = require('common/util/delegate');
    var FpsTimer = require('common/render/FpsTimer');

    function RenderMgr(){
        var frameCallbacks = [];
        var laterCallbacks = [];
        var running = false;
        var idleStartTime = null;
        var fpsTimer = new FpsTimer();
        this.beforeExitFrame = delegate();
        this.beforeEnterFrame = delegate();
        var this_ = this;
        function exec(callbacks, keep){
            var newCallbacks = [];
            while (callbacks.length) {
                var callback = callbacks.pop();
                if (callback() === false ? !keep : keep) {
                    newCallbacks.push(callback);
                }
            }
            return newCallbacks;
        }
        function frame(){
            this_.beforeEnterFrame();
            var idle = false;
            if (idleStartTime) {
                running = timeStamp() - idleStartTime < 256;
            } else {
                frameCallbacks = exec(frameCallbacks, true);
                laterCallbacks = exec(laterCallbacks, false);
                if (!(frameCallbacks.length + laterCallbacks.length)) {
                    idle = true;
                }
            }
            fpsTimer.frame();
            this_.beforeExitFrame();
            if (idle) {
                idleStartTime = timeStamp();
                this_.onIdle();
            }
            return running;
        }
        function start(){
            idleStartTime = null;
            if (!running) {
                running = true;
                fpsTimer.reset();
                renderLoop(frame);
            }
        }
        this.loop = function (callback){
            frameCallbacks.push(callback);
            start();
        };
        this.later = function (callback){
            laterCallbacks.push(callback);
            start();
        };
        this.frame = frame;
        this.isIdle = function (){
            return !!idleStartTime;
        };
        this.onIdle = delegate();
        this.getFps = function (){
            return fpsTimer.averageFPS;
        };
    }

    return new RenderMgr();
});
