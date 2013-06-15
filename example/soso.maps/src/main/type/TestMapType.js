define(function (require){
    var inherits = require('common/util/inherits');
    var TileMapType = require('soso.maps/type/TileMapType');
    var LatLng = require('soso.maps/geo/LatLng');
    var Point = require('soso.maps/geom/Point');

    function TestMapType(){
        TileMapType.call(this);
        this._buff = ['http://localhost/D/tiles/open-streets-dc/',0,'/',0,'/',0,'.png'];
    }
    inherits(TestMapType, TileMapType);

    TestMapType.prototype.getMaxLevel = function (){
        return 18;
    };

    TestMapType.prototype.getTileUrl = function (tileCoord){
        var buff = this._buff;
        var m = 1 << tileCoord.z;
        buff[1] = tileCoord.z;
        buff[3] = tileCoord.x;
        buff[5] = m - tileCoord.y - 1;
        return buff.join('');
    };

//    TestMapType.prototype.getInternalTileOrigin = function (){
////        console.log(this.getProjection().inverse(new Point(0.3220397248654442, 1.4634996824938737)))
//        return new Point(0.3220397248654442, 1.4634996824938737);
//    };

    return TestMapType;
});
