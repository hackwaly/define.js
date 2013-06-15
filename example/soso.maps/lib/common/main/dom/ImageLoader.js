define(function (require){
    var LinkedMap = require('common/struct/LinkedMap');
    var getUid = require('common/object/getUid');
    var timeStamp = require('common/date/timeStamp');
    var getDomain = require('common/url/getDomain');

    function ImageLoader(concurrent, timeout){
        this.timeout = timeout || 15000;
        this._domain = document.domain;
        this.queue = new LinkedMap();
        this.pending = new LinkedMap();
        this.concurrent = concurrent;
    }

    ImageLoader.prototype._blankUrl = 'assets/img/blank.gif';

    ImageLoader.prototype._check = function (force){
        if (force && (this.pending.count >= this.concurrent)) {
            var job = this.pending.peekLast();
            if (job.cancelled) {
                this.pending.remove(job.url);
                this._abort(job);
            }
        }
        while (this.queue.count) {
            if (this.pending.count >= this.concurrent) { break; }
            this._doIt(this.queue.shift());
        }
    };

    ImageLoader.prototype._laterCheck = function (){
        if (!this._checkRequested) {
            this._checkRequested = true;
            var self = this;
            setTimeout(function (){
                self._checkRequested = false;
                self._check();
            }, 0);
        }
    };

    function makeHandler(job, fn, ctx){
        return function (){
            return fn.call(this, job, ctx);
        };
    }

    function finish(job, loaded){
//        setTimeout(function (){
            if (!job.cancelled) {
                job.endTime = timeStamp();
                job.loaded = loaded;
                clearTimeout(job.timer);
                var loader = job.loader;
                if (loader.pending.remove(job.url)) {
                    loader._laterCheck();
                }
                var image = job.image;
                if (!job.cancelled && (loaded || job.force)) {
                    (job.callback)(!loaded ? null : image, job);
                }
                image.onload = null;
                image.onerror = null;
                image.onabort = null;
                job.image = null;
            }
//        }, 50);
    }

    ImageLoader.prototype._doIt = function (job){
        var image = document.createElement('img');
        if (job.crossOrigin) {
            image.crossOrigin = 'anonymous';
        }
        job.image = image;
        job.loader = this;
        job.startTime = timeStamp();
        image.src = job.url;
        job.requested = true;
        if (image.complete) {
            finish(job, true);
        } else {
            this.pending.set(job.url, job);
            image.onload = makeHandler(job, finish, true);
            image.onerror = makeHandler(job, finish, false);
            image.onabort = makeHandler(job, finish, false);
            job.timer = setTimeout(makeHandler(job, finish, false), this.timeout);
        }
    };

    ImageLoader.prototype._abort = function (job){
        if (job.requested) {
            var image = job.image;
            finish(job, false);
            image.crossOrigin = null;
            image.src = this._blankUrl;
            job.cancelled = true;
            job.aborted = true;
        }
    };

    ImageLoader.prototype.loadImage = function (url, callback, force){
        var job = this.pending.get(url);
        if (job && job.cancelled) {
            job.cancelled = false;
            job.callback = callback;
            job.force = force;
        } else {
            job = new Job(url, callback, force);
            if (getDomain(url) !== this._domain) {
                job.crossOrigin = true;
            }
            this.queue.set(getUid(job), job);
            this._check(true);
        }
        return job;
    };

    ImageLoader.prototype.cancelLoadImage = function (job){
        if (!job.cancelled) {
            job.cancelled = true;
            this.queue.remove(getUid(job));
        }
    };

    ImageLoader.prototype.clear = function (force){
        this.queue.forEach(function (job){
            job.cancelled = true;
        });
        this.queue.clear();
        if (force) {
            var job;
            while ((job = this.pending.pop())) {
                this._abort(job);
            }
        } else {
            this.pending.forEach(function (job){
                job.cancelled = true;
            });
        }
    };

    function Job(url, callback, force){
        this.url = url;
        this.callback = callback;
        this.force = force;
    }

    Job.prototype.requested = false;
    Job.prototype.cancelled = false;

    return ImageLoader;
});
