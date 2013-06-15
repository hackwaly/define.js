define(function (require){
    var timeline = require('common/fx/timeline');
    var renderMgr = require('common/render/renderMgr');
    var delegate = require('common/util/delegate');

    function Animation(){
        this._timeline = timeline.subTimeline();
        this._timeline.setTime(0);
        this._timeline.stop();
        this.onStart = delegate();
        this.onEnd = delegate();
        this.onFrame = delegate();
    }

    Animation.prototype._stoped = true;
    Animation.prototype._stopAfterFrame = false;

    Animation.prototype.isStoped = function (){
        return this._stoped;
    };
    Animation.prototype.getTimeline = function (){
        return this._timeline;
    };
    Animation.prototype.setDuration = function (duration){
        this._duration = duration;
    };
    Animation.prototype.setBeginValues = function (values){
        this._beginValues = values;
    };
    Animation.prototype.getBeginValues = function (){
        return this._beginValues;
    };
    Animation.prototype.setEndValues = function (values){
        this._endValues = values;
    };
    Animation.prototype.getEndValues = function (){
        return this._endValues;
    };
    Animation.prototype.getValues = function (time){
        var position = this.getPosition(time);
        var duration = this._duration;
        var tween = this._tween;
        var begins = this._beginValues;
        var ends = this._endValues;
        var values = [];
        for (var i=0; i<begins.length; i++) {
            values[i] = begins[i] + tween(position) * (ends[i] - begins[i]);
        }
        return values;
    };
    Animation.prototype.getPosition = function (time){
        time = time == null ? this.getElapsedTime() : time;
        return this._duration === 0 ? 1 : time / this._duration;
    };
    Animation.prototype.setPosition = function (pos){
        this._timeline.setTime(this._duration * pos);
    };
    Animation.prototype.setTween = function (tween){
        this._tween = tween;
    };
    Animation.prototype.setApplier = function (applier){
        this._applier = applier;
    };
    Animation.prototype.getElapsedTime = function (){
        return this._timeline.getTime();
    };
    Animation.prototype.start = function (){
        var self = this;
        if (self._stoped) {
            self._stoped = false;
            var timeline = this._timeline;
            timeline.setTime(0);
            if (self._duration) {
                timeline.start();
                renderMgr.loop(function (){
                    var time = timeline.getTime();
                    var duration = self._duration;
                    var elapsedTime = self.getElapsedTime();
                    if (elapsedTime > duration) {
                        elapsedTime = duration;
                    }
                    return self._frame(elapsedTime);
                });
                self.onStart();
            } else {
                self.onStart();
                self._frame(0);
                self.onEnd();
            }
        }
    };
    Animation.prototype.stop = function (toEnd){
        this._timeline.stop();
        if (toEnd) {
            this._timeline.setTime(this._duration);
            if (!this._stoped) {
                this._stopAfterFrame = true;
            }
        } else {
            this._stoped = true;
            this.onEnd();
        }
    };
    Animation.prototype.cancel = function (){
        this._timeline.stop();
        this._stoped = true;
        this.onEnd(true);
    };
    Animation.prototype._frame = function (elapsedTime){
        if (this._stoped) {
            return false;
        }
        this.onFrame(this.getPosition(elapsedTime));
        var duration = this._duration;
        var applier = this._applier;
        var values = this.getValues(elapsedTime);
        if (applier(values, elapsedTime) === false) {
            this.stop();
            return false;
        }
        if (elapsedTime >= duration) {
            this._stoped = true;
            this.stop(true);
            this.onEnd(true);
            return false;
        }
        if (this._stopAfterFrame) {
            this._stopAfterFrame = false;
            this.stop();
            return false;
        }
    };
    return Animation;
});
