define(function (require){
    var removeNode = require('common/dom/removeNode');

    function ZoomIndicator(){

    }

    ZoomIndicator.prototype.render = function (div){
        var doc = div.ownerDocument;
        var elm1 = doc.createElement('div');
        var elm2 = doc.createElement('div');
        var elm3 = doc.createElement('div');
        var elm4 = doc.createElement('div');
        elm1.style.cssText = 'position:absolute;overflow:hidden;width:1px;height:10px;border:1px solid red;background-color:red;';
        elm2.style.cssText = 'position:absolute;overflow:hidden;height:1px;width:10px;border:1px solid red;background-color:red;';
        elm3.style.cssText = 'position:absolute;overflow:hidden;width:1px;height:10px;border:1px solid red;background-color:red;';
        elm4.style.cssText = 'position:absolute;overflow:hidden;height:1px;width:10px;border:1px solid red;background-color:red;';
        div.appendChild(elm1);
        div.appendChild(elm2);
        div.appendChild(elm3);
        div.appendChild(elm4);
        this._elm1 = elm1;
        this._elm2 = elm2;
        this._elm3 = elm3;
        this._elm4 = elm4;
    };

    ZoomIndicator.prototype.destroy = function (){
        removeNode(this._elm1);
        removeNode(this._elm2);
        removeNode(this._elm3);
        removeNode(this._elm4);
        this._elm1 = null;
        this._elm2 = null;
        this._elm3 = null;
        this._elm4 = null;
    };

    ZoomIndicator.prototype.update = function (pixel, zoomLevel, zoomInOrOut){
        var length = 10;
        var factor = zoomInOrOut ? zoomLevel - Math.floor(zoomLevel) :
            1 - (Math.ceil(zoomLevel) - zoomLevel);
        var radius = 10 + 20 * factor;
        var elm1 = this._elm1;
        var elm2 = this._elm2;
        var elm3 = this._elm3;
        var elm4 = this._elm4;
        elm1.style.left = pixel.x + 'px';
        elm3.style.left = pixel.x + 'px';
        elm1.style.top = pixel.y - radius - length + 'px';
        elm3.style.top = pixel.y + radius + 'px';
        elm2.style.top = pixel.y + 'px';
        elm4.style.top = pixel.y + 'px';
        elm2.style.left = pixel.x - radius - length + 'px';
        elm4.style.left = pixel.x + radius + 'px';
    };

    return ZoomIndicator;
});
