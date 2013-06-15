define(function (require){
    var inherits = require('common/util/inherits');
    var TileMapType = require('soso.maps/type/TileMapType');
    var modulo = require('common/math/modulo');

    function GoogleMapType(){
        TileMapType.call(this);
        this._buff = ['http://khm', 0, '.google.com/kh/v=125&src=app&hl=zh-CN&s=Galileo&x=', 0, '&y=', 0, '&z=', 0];
    }
    inherits(GoogleMapType, TileMapType);

    GoogleMapType.prototype.getMaxLevel = function (){
        return 20;
    };

    GoogleMapType.prototype.getTileUrl = function (tileCoord){
        var x = tileCoord.x;
        var y = tileCoord.y;
        var z = tileCoord.z;
        var buff = this._buff;
        buff[1] = modulo(x + y, 2);
        buff[3] = x;
        buff[5] = y;
        buff[7] = z;
        return buff.join('');
    };

    GoogleMapType.prototype.isSmooth = function (){
        return true;
    };

    return GoogleMapType;
});
