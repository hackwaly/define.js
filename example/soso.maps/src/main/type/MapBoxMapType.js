define(function (require){
    var inherits = require('common/util/inherits');
    var TileMapType = require('soso.maps/type/TileMapType');
    var modulo = require('common/math/modulo');

    function MapBoxMapType(){
        TileMapType.call(this);
        this._buff = ['http://',0,'.tiles.mapbox.com/v3/examples.map-4l7djmvo/',0,'/',0,'/',0,'.png'];
    }
    inherits(MapBoxMapType, TileMapType);

    MapBoxMapType.prototype.getMaxLevel = function (){
        return 17;
    };

    MapBoxMapType.prototype.getTileUrl = function (tileCoord){
        var x = tileCoord.x;
        var y = tileCoord.y;
        var z = tileCoord.z;
        var buff = this._buff;
        buff[1] = String.fromCharCode('a'.charCodeAt(0) + modulo(x + y, 4));
        buff[3] = z;
        buff[5] = x;
        buff[7] = y;
        return buff.join('');
    };

    return MapBoxMapType;
});
