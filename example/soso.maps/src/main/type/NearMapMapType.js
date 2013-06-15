define(function (require){
    var inherits = require('common/util/inherits');
    var TileMapType = require('soso.maps/type/TileMapType');
    var modulo = require('common/math/modulo');

    function NearMapMapType(){
        TileMapType.call(this);
    }
    inherits(NearMapMapType, TileMapType);

    NearMapMapType.prototype.getMaxLevel = function (){
        return 21;
    };

    NearMapMapType.prototype.getTileUrl = function (tileCoord){
        var x = tileCoord.x;
        var y = tileCoord.y;
        var z = tileCoord.z;
        var m = 1 << z;
        if (y >= 0 && y < m) {
            x = modulo(x, m);
            return ['http://web', (x + y) % 4, '.nearmap.com/maps/hl=en&nml=Vert&x=',
                x, '&y=', y, '&z=', z].join('');
        }
        return null;
    };

    return NearMapMapType;
});
