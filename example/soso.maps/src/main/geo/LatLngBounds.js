define(function (require){
    var LatLng = require('soso.maps/geo/LatLng');
    var LatSpan = require('soso.maps/geo/LatSpan');
    var LngSpan = require('soso.maps/geo/LngSpan');

    function LatLngBounds(sw, ne, otherwise){
        if (sw) {
            ne = ne || sw;
            var sw_lng = sw.lng;
            var ne_lng = ne.lng;
            var sw_lat = Math.min(sw.lat, ne.lat);
            var ne_lat = Math.max(sw.lat, ne.lat);
            if (otherwise) {
                if (sw_lng === ne_lng) {
                    sw_lng = -180;
                    ne_lng = 180;
                } else {
                    sw_lng = ne.lng;
                    ne_lng = sw.lng;
                }
            }
            this.lat_span = new LatSpan(sw_lat, ne_lat);
            this.lng_span = new LngSpan(sw_lng, ne_lng);
        } else {
            this.lat_span = new LatSpan(0, 0);
            this.lng_span = new LngSpan(0, 0);
        }
    }

    LatLngBounds.prototype.isEmpty = function (){
        return this.lat_span.isEmpty() ||
            this.lng_span.isEmpty();
    };

    LatLngBounds.prototype.getSouthWest = function (){
        return new LatLng(this.lat_span.sw, this.lng_span.sw);
    };

    LatLngBounds.prototype.getNorthEast = function (){
        return new LatLng(this.lat_span.ne, this.lng_span.ne);
    };

    LatLngBounds.prototype.getCenter = function (){
        return new LatLng(this.lat_span.center(), this.lng_span.center());
    };

    LatLngBounds.prototype.toSpan = function (){
        return new LatLng(this.lat_span.toSpan(), this.lng_span.toSpan());
    };

    LatLngBounds.prototype.intersects = function (other){
        return this.lat_span.intersects(other.lat_span) &&
            this.lng_span.intersects(other.lng_span);
    };

    LatLngBounds.prototype.contains = function (latLng, strict){
        return this.lat_span.contains(latLng, strict) &&
            this.lng_span.contains(latLng, strict);
    };

    LatLngBounds.prototype.extend = function (latLng){
        this.lat_span.extend(latLng.lat);
        this.lng_span.extend(latLng.lng);
        return this;
    };

    LatLngBounds.prototype.union = function (other){
        return this.extend(other.getSouthWest()).extend(other.getNorthEast());
    };

    LatLngBounds.prototype.clone = function (){
        return new LatLngBounds2(this.lat_span, this.lng_span);
    };

    LatLngBounds.prototype.equals = function (other){
        return this.lat_span.equals(other.lat_span) &&
            this.lng_span.equals(other.lng_span);
    };

    function LatLngBounds2(lat_span, lng_span){
        this.lat_span = lat_span.clone();
        this.lng_span = lng_span.clone();
    }

    LatLngBounds2.prototype = LatLngBounds.prototype;

    return LatLngBounds;
});
