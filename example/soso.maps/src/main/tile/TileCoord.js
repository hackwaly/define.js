define(function (require){
    function TileCoord(z, x, y){
        this.z = z;
        this.x = x;
        this.y = y;
    }
    TileCoord.prototype.clone = function (){
        return new TileCoord(this.z, this.x, this.y);
    };
    TileCoord.prototype.toString = function (){
        return [this.z, this.x, this.y].join('/');
    };
    return TileCoord;
});
