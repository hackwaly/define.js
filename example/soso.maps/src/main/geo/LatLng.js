define(function (require){
    var clamp = require('common/math/clamp');
    var loop = require('common/math/loop');

    function LatLng(lat, lng, noWrap){
        this.lat = clamp(lat, -90, 90);
        this.lng = !noWrap ? loop(lng, -180, 180) :
            clamp(lng, -180, 180);
    }

    LatLng.prototype.equals = function (other){
        return this.lat === other.lat &&
            this.lng === other.lng;
    };

    LatLng.prototype.clone = function (){
        return new LatLng(this.lat, this.lng);
    };

    LatLng.prototype.toString = function (){
        return this.lat + ',' + this.lng;
    };

    return LatLng;
});
