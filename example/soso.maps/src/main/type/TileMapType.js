define(function (require){
    var inherits = require('common/util/inherits');
    var Point = require('soso.maps/geom/Point');
    var MapType = require('soso.maps/type/MapType');
    var SphericalMercator = require('soso.maps/projection/SphericalMercator');
    var TileLayer = require('soso.maps/tile/TileLayer');

    var defaultTileSize = new Point(256, 256);

    function TileMapType(tileSize, projection, baseWorldWidth){
        projection = projection || SphericalMercator;
        tileSize = tileSize || defaultTileSize;
        this._tileSize = tileSize;
        MapType.call(this, projection, baseWorldWidth || tileSize.x);
    }
    inherits(TileMapType, MapType);

    TileMapType.prototype.getWorldWidth = function (level){
        return this._baseWorldWidth * Math.pow(2, level);
    };
    TileMapType.prototype.fixLayer = function (layer){
        if (!(layer instanceof TileLayer)) {
            layer = new TileLayer();
        }
        layer.setTileSource(this);
        return layer;
    };
    TileMapType.prototype.isSmooth = function (){
        return false;
    };
    TileMapType.prototype.getTileSize = function (){
        return this._tileSize;
    };
    TileMapType.prototype.getTileUrl = function (){
        return null;
    };
    TileMapType.prototype.getInternalTileOrigin = function (){
        return new Point(0, 0);
    };
    return TileMapType;
});
