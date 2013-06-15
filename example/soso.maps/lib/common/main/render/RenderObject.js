define(function (require){
    var renderMgr = require('common/render/renderMgr');
    var delegate = require('common/util/delegate');
    var nop = require('common/function/nop');
    var bind = require('common/function/bind');

    function RenderObject(){
    }

    RenderObject.prototype._changes = 0;
    RenderObject.prototype._renderRequested = false;

    RenderObject.prototype.setChanges = function (changes){
        this._changes |= changes;
        this.renderChangesLater();
    };

    RenderObject.prototype.renderChangesLater = function (){
        if (!this._renderRequested) {
            this._renderRequested = true;
            if (!this._rendering) {
                renderMgr.later(bind(this.renderChanges, this));
            }
        }
    };

    RenderObject.prototype.hasChanges = function (changes){
        return (this._changes & changes) === changes;
    };

    RenderObject.prototype.hasAnyChanges = function (changes){
        return (this._changes & changes);
    };

    RenderObject.prototype.unsetChanges = function (changes){
        this._changes &= ~changes;
    };

    RenderObject.prototype.renderChanges = function (){
        this._rendering = true;
        this._renderRequested = false;
        if (this.beforeRenderChanges() !== false) {
            this.doRenderChanges();
            this._changes = 0;
        }
        this._rendering = false;
        return !this._renderRequested;
    };

    RenderObject.prototype.beforeRenderChanges = nop;
    RenderObject.prototype.doRenderChanges = nop;

    return RenderObject;
});
