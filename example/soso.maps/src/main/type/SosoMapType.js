define(function (require){
    var inherits = require('common/util/inherits');
    var TileMapType = require('soso.maps/type/TileMapType');
    var modulo = require('common/math/modulo');

    function SosoMapType(){
        TileMapType.call(this);
    }
    inherits(SosoMapType, TileMapType);

    SosoMapType.prototype.getMaxLevel = function (){
        return 18;
    };
    SosoMapType.prototype.getMinLevel = function (){
        return 1;
    };

    SosoMapType.prototype.getTileUrl = function (tileCoord){
        var z = tileCoord.z;
        var m = 1 << z;
        var y = m - 1 - tileCoord.y;
        var x = tileCoord.x;
        return ['http://p', modulo(x + y, 4), '.map.soso.com/maptilesv2/', z,
            '/', x >> 4, '/', y >> 4,'/', x, '_', y ,'.png'].join('');
    };

    return SosoMapType;
});
