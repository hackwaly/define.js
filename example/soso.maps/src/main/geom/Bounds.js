define(function (require){
    var Point = require('soso.maps/geom/Point');
    function Bounds(minX, minY, maxX, maxY){
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    Bounds.prototype.getMin = function (){
        return new Point(this.minX, this.minY);
    };
    Bounds.prototype.toSpan = function (){
        return new Point(this.maxX - this.minX, this.maxY - this.minY);
    };
    Bounds.prototype.getCenter = function (){
        return new Point((this.maxX + this.minX) / 2, (this.maxY + this.minY) / 2);
    };
    Bounds.prototype.clone = function (){
        return new Bounds(this.minX, this.minY, this.maxX, this.maxY);
    };
    return Bounds;
});
