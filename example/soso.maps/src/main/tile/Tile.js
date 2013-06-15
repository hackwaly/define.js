define(function (require){
    function Tile(tileCoord, url){
        this.tileCoord = tileCoord;
        this.key = tileCoord + '';
        this.url = url;
    }
    return Tile;
});
