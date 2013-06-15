define(function (require){
    var LatLngBounds = require('soso.maps/geom/Bounds');
    var Point = require('soso.maps/geom/Point');
    var LatLng = require('soso.maps/geo/LatLng');
    function EPSG4326(){

    }
    EPSG4326.prototype.forward = function (latLng){
        return new Point(latLng.lng, -latLng.lat);
    };
    EPSG4326.prototype.inverse = function (point){
        return new LatLng(-point.y, point.x);
    };
    EPSG4326.prototype.fixBounds = function (min, max){
        return new LatLngBounds(min, max);
    };
    return new EPSG4326();
});
