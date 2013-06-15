define(function (require){
    var timeStamp = require('common/date/timeStamp');
    var NUM_FRAMES_TO_AVERAGE = 16;
    function FpsTimer(){
        var lastTime = null;
        var table = [];
        var cursor = 0;
        var count = 0;
        var totalTime = 0;
        var self = this;
        self.averageFPS = 0;
        self.frame = function (){
            if (!lastTime) {
                lastTime = timeStamp();
            } else {
                var time = timeStamp();
                var elapsedTime = time - lastTime;
                lastTime = time;
                if (++ count > NUM_FRAMES_TO_AVERAGE) {
                    totalTime -= table[cursor];
                }
                table[cursor] = elapsedTime;
                cursor = count % NUM_FRAMES_TO_AVERAGE;
                totalTime += elapsedTime;
                self.averageFPS = Math.floor(1000 / (totalTime / Math.min(count, 16)) + 0.5);
            }
        };
        self.reset = function (){
            totalTime = 0;
            table = [];
            lastTime = null;
            cursor = 0;
            count = 0;
            self.averageFPS = 0;
        };
    }
    return FpsTimer;
});
