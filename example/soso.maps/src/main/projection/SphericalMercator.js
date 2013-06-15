define(function (require){
    var Point = require('soso.maps/geom/Point');
    var LatLng = require('soso.maps/geo/LatLng');
    var LatLngBounds = require('soso.maps/geo/LatLngBounds');

    function SphericalMercator(){
        var PI = Math.PI;
        var DOUBLE_PI = PI * 2;
        var _360_DIV_PI = 360 / PI;
        this.forward = function (latlng){
            return new Point(
                latlng.lng / 360 + 0.5,
                Math.log(Math.tan((-latlng.lat / 360 + 0.25) * PI)) / DOUBLE_PI + 0.5
            );
        };
        this.inverse = function (point){
            return new LatLng(
                Math.atan(Math.exp((0.5 - point.y) * DOUBLE_PI)) * _360_DIV_PI - 90,
                point.x * 360 - 180
            );
        };
    }
    SphericalMercator.prototype.fixBounds = function (p1, p2){
        return new LatLngBounds(p1, p2);
    };
    return new SphericalMercator();
});
