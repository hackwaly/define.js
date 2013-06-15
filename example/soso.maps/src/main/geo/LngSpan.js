define(function (require){
    var inherits = require('common/util/inherits');
    var LatSpan = require('soso.maps/geo/LatSpan');

    function LngSpan(sw, ne){
        this.sw = sw;
        this.ne = ne;
    }
    inherits(LngSpan, LatSpan);

    LngSpan.prototype.lngMode = true;
    LngSpan.prototype.clone = function (){
        return new LngSpan(this.sw, this.ne);
    };
    return LngSpan;
});
