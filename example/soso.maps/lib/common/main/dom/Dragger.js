define(function (require){
    var addListener = require('common/dom/event/addListener');
    var removeListener = require('common/dom/event/removeListener');
    var preventDefault = require('common/dom/event/preventDefault');
    var getEventTarget = require('common/dom/event/getTarget');
    var delegate = require('common/util/delegate');
    var bind = require('common/function/bind');
    var returnFalse = require('common/function/returnFalse');
    var IE678 = require('common/browser/IE678');
    var IE = require('common/browser/IE');

    function Dragger(){
        this._handleElms = [];
        this._doOnMouseDown = bind(this._doOnMouseDown, this);
        this._doOnMouseMove = bind(this._doOnMouseMove, this);
        this._doOnRelease = bind(this._doOnRelease, this);
        this._doOnTimeout = bind(this._doOnTimeout, this);
        this.onDragStart = delegate();
        this.onDragMove = delegate();
        this.onDragEnd = delegate();
    }

    Dragger.prototype._dragging = false;
    Dragger.prototype._dragStartX = NaN;
    Dragger.prototype._dragStartY = NaN;

    Dragger.prototype.listen = function (elm){
        this._handleElms.push(elm);
        addListener(elm, 'mousedown', this._doOnMouseDown);
//        addListener(elm, 'touchstart', this._doOnMouseDown);
        addListener(elm, 'selectstart', returnFalse);
    };

    Dragger.prototype.destroy = function (){
        this._doEndDrag();
        var elms = this._handleElms;
        for (var j=elms.length; j--;) {
            removeListener(elms[j], 'mousedown', this._doOnMouseDown);
            removeListener(elms[j], 'touchstart', this._doOnMouseDown);
            removeListener(elms[j], 'selectstart', returnFalse);
        }
    };

    Dragger.prototype._doOnMouseDown = function (evt){
        var elm = getEventTarget(evt);
        if (evt.type === 'touchstart') {
            if (evt.touches.length === 1) {
                this._dragStartX = evt.touches[0].screenX;
                this._dragStartY = evt.touches[0].screenY;
            }
        } else {
            this._dragStartX = evt.screenX;
            this._dragStartY = evt.screenY;
        }
        this._doStartDrag();
        if (!IE) {
            preventDefault(evt);
        }
    };

    Dragger.prototype._doOnMouseMove = function (evt){
        var screenX;
        var screenY;
        var clientX;
        var clientY;
        if (evt.type === 'touchmove') {
            screenX = evt.touches[0].screenX;
            screenY = evt.touches[0].screenY;
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else {
            screenX = evt.screenX;
            screenY = evt.screenY;
            clientX = evt.clientX;
            clientY = evt.clientY;
        }
        var deltaX = screenX - this._dragStartX;
        var deltaY = screenY - this._dragStartY;
        if (!this._dragging) {
            if (Math.abs(deltaX) > 1 ||
                Math.abs(deltaY) > 1) {
                if (this.onDragStart(clientX - deltaX, clientY - deltaY, evt) !== false) {
                    this._dragging = true;
                    if (deltaX !== 0 || deltaY !== 0) {
                        this.onDragMove(clientX, clientY, evt);
                    }
                    preventDefault(evt);
                } else {
                    this._doEndDrag();
                }
            }
        } else {
            this.onDragMove(clientX, clientY, evt);
            preventDefault(evt);
        }
    };

    Dragger.prototype._doStartDrag = function (){
        if (IE678) {
            document.documentElement.attachEvent('onmousemove', this._doOnMouseMove);
            document.documentElement.attachEvent('onmouseup', this._doOnRelease);
            document.documentElement.attachEvent('onlosecapture', this._doOnRelease);
            document.documentElement.setCapture();
        } else {
            document.addEventListener('mousemove', this._doOnMouseMove, true);
//            document.addEventListener('touchmove', this._doOnMouseMove, true);
            document.addEventListener('mouseup', this._doOnRelease, true);
//            document.addEventListener('touchend', this._doOnRelease, true);
        }
    };

    Dragger.prototype._doEndDrag = function (){
        if (IE678) {
            document.documentElement.detachEvent('onmousemove', this._doOnMouseMove);
            document.documentElement.detachEvent('onmouseup', this._doOnRelease);
            document.documentElement.detachEvent('onlosecapture', this._doOnRelease);
            document.documentElement.releaseCapture();
        } else {
            document.removeEventListener('mousemove', this._doOnMouseMove, true);
//            document.removeEventListener('touchmove', this._doOnMouseMove, true);
            document.removeEventListener('mouseup', this._doOnRelease, true);
//            document.removeEventListener('touchend', this._doOnRelease, true);
        }
    };

    Dragger.prototype._doOnRelease = function (evt){
        if (this._dragging) {
            this.onDragEnd(null, null, evt);
            this._dragging = false;
        }
        this._doEndDrag();
    };
    return Dragger;
});
