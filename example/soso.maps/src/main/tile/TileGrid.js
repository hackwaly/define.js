define(function (require){
    var hop = require('common/object/hop');
    var TileCoord = require('soso.maps/tile/TileCoord');
    var Tile = require('soso.maps/tile/Tile');
    function TileGrid(){
        this._filledMap = {};
        this._tiles = [];
        this._level = -1;
    }
    TileGrid.prototype.reinit = function (minLevel, cache){
        this._minLevel = minLevel;
        this._cache = cache;
    };
    TileGrid.prototype.update = function (grid, level){
        var cache = this._cache;
        var fillMap = {};
        var toDrawLevelTiles = [];
        var toLoadLevelTiles = [];
        var tileCoord = new TileCoord(level, 0, 0);
        var tile;
        var tileKey;
        for (var x=grid.minX; x<=grid.maxX; x++) {
            tileCoord.x = x;
            for (var y=grid.minY; x<=grid.maxY; y++) {
                tileCoord.y = y;
                tileKey = tileCoord + '';
                tile = new Tile(tileCoord);
                var image = cache.get(tileKey);
                if (image) {
                    tile.image = image;
                    fillMap[tileKey] = toDrawLevelTiles.push(tile);
                } else {
                    fillMap[tileKey] = -1;
                }
            }
        }
        var lastTiles = this._tiles;
        for (var j=lastTiles.length; j--;) {
            tile = lastTiles[j];
            tileKey = tile.key;
            if (hop(fillMap, tileKey)) {

            }
        }
    };
    return TileGrid;
});
