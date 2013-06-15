define(function (require){
    var Bounds = require('soso.maps/geom/Bounds');
    var Point = require('soso.maps/geom/Point');
    function PixelProjection(){

    }
    PixelProjection.prototype.forward = function (point){
        return new Point(point.x, -point.y);
    };
    PixelProjection.prototype.inverse = function (point){
        return new Point(point.x, -point.y);
    };
    PixelProjection.prototype.fixBounds = function (min, max){
        return new Bounds(min.x, min.y, max.x, max.y);
    };
    return new PixelProjection();
});
