define(function (require){
    var LatLng = require('soso.maps/geo/LatLng');
    var PixelProjection = require('soso.maps/projection/PixelProjection');

    function MapType(projection, baseWorldWidth){
        this._projection = projection || PixelProjection;
        if (projection) {
            var p1 = projection.forward(new LatLng(0, -180));
            var p2 = projection.forward(new LatLng(0, 180, true));
            this._projectedWorldWidth = Math.abs(p1.x - p2.x);
        } else {
            this._projectedWorldWidth = baseWorldWidth | 0;
        }
        this._baseWorldWidth = baseWorldWidth || this._projectedWorldWidth;
    }
    MapType.prototype.getMinLevel = function (){
        return 0;
    };
    MapType.prototype.getMaxLevel = function (){
        return 0;
    };
    MapType.prototype.getBaseWorldWidth = function (){
        return this._baseWorldWidth;
    };
    MapType.prototype.getWorldWidth = function (){
        return this.getBaseWorldWidth();
    };
    MapType.prototype.getProjection = function (){
        return this._projection;
    };
    MapType.prototype.getResolution = function (level){
        return this._projectedWorldWidth / this.getWorldWidth(level);
    };
    MapType.prototype.fixLayer = function (){
        return null;
    };

    return MapType;
});
