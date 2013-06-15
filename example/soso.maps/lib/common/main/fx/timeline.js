define(function (require){
    var timeStamp = require('common/date/timeStamp');

    function Timeline(parent){
        var time = parent.getTime();
        this._parent = parent;
        this._initialTime = time;
        this._lastTime = time;
        this._lastParentTime = time;
    }

    Timeline.prototype._lastTime = 0;
    Timeline.prototype._initialTime = 0;
    Timeline.prototype._speed = 1.0;
    Timeline.prototype._stoped = true;

    Timeline.prototype.setSpeed = function (speed){
        this._mark();
        this._speed = speed;
    };
    Timeline.prototype._mark = function (){
        this._lastTime = this.getTime();
        this._lastParentTime = this._parent.getTime();
    };
    Timeline.prototype.start = function (){
        if (this._stoped) {
            this._lastParentTime = this._parent.getTime();
            this._stoped = false;
        }
        return this;
    };
    Timeline.prototype.stop = function (){
        if (!this._stoped) {
            this._mark();
            this._stoped = true;
        }
        return this;
    };
    Timeline.prototype.reset = function (){
        this._lastTime = this._initialTime;
        this._lastParentTime = this._parent.getTime();
        return this;
    };
    Timeline.prototype.getTime = function (){
        var time = this._lastTime;
        if (this._stoped) {
            return time;
        }
        var currentParentTime = this._parent.getTime();
        var lastParentTime = this._lastParentTime;
        return time + (currentParentTime - lastParentTime) * this._speed;
    };
    Timeline.prototype.setTime = function (time){
        this._lastTime = time;
        this._lastParentTime = this._parent.getTime();
    };
    Timeline.prototype.subTimeline = function (){
        return new Timeline(this).start();
    };

    return new Timeline({
        getTime: timeStamp
    }).start();
});
