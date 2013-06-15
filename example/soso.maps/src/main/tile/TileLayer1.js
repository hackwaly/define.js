define(function (require){
    var delegate = require('common/util/delegate');
    var inherits = require('common/util/inherits');
    var RenderObject = require('common/render/RenderObject');
    var bind = require('common/function/bind');
    var LinkedMap = require('common/struct/LinkedMap');
    var removeNode = require('common/dom/removeNode');
    var test_CANVAS = require('common/browser/support/test_CANVAS');
    var test_WEBGL = require('common/browser/support/test_WEBGL');
    var WEBKIT = require('common/browser/WEBKIT');
    var GECKO = require('common/browser/GECKO');
    var IE9P = require('common/browser/IE9P');
    var ImageLoader = require('common/dom/ImageLoader');
    var Changes = require('soso.maps/map/Changes');
    var TileCoord = require('soso.maps/tile/TileCoord');
    var Tile = require('soso.maps/tile/Tile');
    var Canvas = require('soso.maps/tile/Canvas');
    var CSSCanvas = require('soso.maps/tile/CSSCanvas');
    var FlashCanvas = require('soso.maps/tile/FlashCanvas');
    var WebGLCanvas = require('soso.maps/tile/WebGLCanvas');

    var USE_WEBGL = false;//WEBKIT;
    var USE_CANVAS = false;//GECKO;

    function TileLayer(){
        this._cache = new LinkedMap(1024);
        this._loader = new ImageLoader(5);
        this._preloader = new ImageLoader(1);
        this.onDropTile = delegate();
        var self = this;
        this._cache.onDrop.addCallback(function (tile){
            self._doOnDropTile(tile);
        });
        this._doOnMapChanges = bind(this._doOnMapChanges, this);
    }
    inherits(TileLayer, RenderObject);

    var REDRAW_FIELDS =
        Changes.BOUNDS |
        Changes.MAP_TYPE;

    TileLayer.prototype.setMap = function (map){
        var oldMap = this._map;
        if (map !== oldMap) {
            if (oldMap) {
                oldMap.removeRenderChangesHandler(REDRAW_FIELDS, this._doOnMapChanges);
                this.destroy();
            }
            if (map) {
                this._map = map;
                this._mapType = map.getMapType();
                this.construct();
                map.addRenderChangesHandler(REDRAW_FIELDS, this._doOnMapChanges);
            }
        }
    };
    TileLayer.prototype.getMap = function (){
        return this._map;
    };
    TileLayer.prototype.construct = function (){
        this._useWebGL = USE_WEBGL && test_CANVAS() && test_WEBGL();
        this._useCanvas = this._useWebGL || (USE_CANVAS && test_CANVAS());
        var pane = this._map.getPanes()["canvas"];
        var canvasElm = document.createElement(this._useCanvas ? 'canvas' : 'div');
        canvasElm.style.cssText = 'position:absolute;';
        pane.appendChild(canvasElm);
        this._canvasElm = canvasElm;
        if (this._useWebGL) {
            this._canvas = new WebGLCanvas(canvasElm);
        } else if (this._useCanvas) {
            this._canvas = new Canvas(canvasElm);
        } else {
            this._canvas = new CSSCanvas(canvasElm);
        }
    };
    TileLayer.prototype.destroy = function (){
        this._canvas.destroy();
        this._canvas = null;
        removeNode(this._canvasElm);
        this._canvasElm = null;
    };
    TileLayer.prototype.setTileSource = function (ts){
        this._ts = ts;
    };
    TileLayer.prototype.getTile = function (tileCoord, peek){
        var key = tileCoord + '';
        return (!peek ? this._cache.get(key) : this._cache.peekValue(key)) ||
            new Tile(tileCoord.clone(), this._ts.getTileUrl(tileCoord));
    };
    TileLayer.prototype._computeGird = function (level, bounds){
        var resolution = this._mapType.getResolution(level);
        var tileSize = this._ts.getTileSize();
        var tileOrigin = this._ts.getInternalTileOrigin();
        var tw = tileSize.x * resolution;
        var th = tileSize.y * resolution;
        var grid = bounds.clone();
        grid.minX = Math.floor((grid.minX - tileOrigin.x) / tw);
        grid.maxX = Math.ceil((grid.maxX - tileOrigin.x) / tw);
        grid.minY = Math.floor((grid.minY - tileOrigin.y) / th);
        grid.maxY = Math.ceil((grid.maxY - tileOrigin.y) / th);
        return grid;
    };
    TileLayer.prototype._doOnMapChanges = function (changes){
        this.setChanges(changes);
    };
    TileLayer.prototype._doOnDropTile = function (tile){
        if (tile.loaded) {
            this._canvas.releaseImage(tile.image);
        } else if (tile.requested) {
            this._loader.remove(tile.key);
        }
        tile.requested = false;
        tile.loaded = false;
    };

    TileLayer.prototype.clear = function (){
        this._loader.clear();
        this._preloader.clear(true);
        this._canvas.clear();
    };

    TileLayer.prototype.loadTile = function (tile, loader){
        var self = this;
        if (!tile.job || tile.job.cancelled) {
            tile.job = loader.loadImage(tile.url, function (image){
                tile.image = image;
                tile.loaded = true;
                self._cache.set(tile.key, tile);
                self.renderChangesLater();
            });
        }
    };

    TileLayer.prototype.doRenderChanges = function (changes){
        var self = this;
        this.clear();
        if (this.hasChanges(Changes.SIZE)) {
            var size = this._map.getSize();
            this._canvasElm.width = size.x;
            this._canvasElm.height = size.y;
            this._canvasElm.style.marginLeft = Math.round(- size.x / 2) + 'px';
            this._canvasElm.style.marginTop = Math.round(- size.y / 2) + 'px';
            this._canvas.updateSize();
        }

        var optimalLevel = Math.ceil(this._map.getZoomLevel() - 0.5);
        var bounds = this._map.getInternalBounds();
        var grid = this._computeGird(optimalLevel, bounds);
        var toDrawLevels = [];
        var toLoadLevels = [];

        function sortTiles(toLoadLevelTiles){

        }

        var tile;
        var toLoadLevelTiles = [];
        var toDrawLevelTiles = [];
        var tileCoord = new TileCoord(optimalLevel, 0, 0);
        for (var x=grid.minX; x<=grid.maxX; x++) {
            tileCoord.x = x;
            for (var y=grid.minY; y<=grid.maxY; y++) {
                tileCoord.y = y;
                tile = this.getTile(tileCoord);
                if (tile.loaded) {
                    toDrawLevelTiles.push(tile);
                } else {
                    toLoadLevelTiles.push(tile);
                }
            }
        }
        toDrawLevels.push(toDrawLevelTiles);
        toLoadLevels.push(toLoadLevelTiles);

        var j, k;
        var level;
        var minLevel = this._mapType.getMinLevel();
        var stopLoadLevel = Math.max(minLevel, optimalLevel - 2);
        for (level=optimalLevel-1; toLoadLevelTiles.length&&(level>=minLevel); level--) {
            var stillLoad = level >= stopLoadLevel;
            var toLoadUpLevelTiles = [];
            toDrawLevelTiles = [];
            var hash = {};
            for (j=toLoadLevelTiles.length; j--;) {
                tile = toLoadLevelTiles[j];
                tileCoord.z = level;
                tileCoord.x = tile.tileCoord.x >> 1;
                tileCoord.y = tile.tileCoord.y >> 1;
                var upTile = this.getTile(tileCoord, !stillLoad);
                if (!hash[upTile.key]) {
                    hash[upTile.key] = true;
                    if (upTile.loaded) {
                        toDrawLevelTiles.push(upTile);
                    } else {
                        toLoadUpLevelTiles.push(upTile);
                    }
                }
            }
            toDrawLevels.push(toDrawLevelTiles);
            toLoadLevelTiles = toLoadUpLevelTiles;
            if (stillLoad && toLoadLevelTiles.length) {
                toLoadLevels.push(toLoadLevelTiles);
            }
        }

        var resolution = this._map.getResolution();
        var leftTop = bounds.getMin();
        var canvas = this._canvas;
        for (j=toDrawLevels.length; j--;) {
            toDrawLevelTiles = toDrawLevels[j];
            if (toDrawLevelTiles.length) {
                level = toDrawLevelTiles[0].tileCoord.z;
                var tileResolution = this._mapType.getResolution(level);
                var internalTileOrigin = this._ts.getInternalTileOrigin();
                var internalTileSize = this._ts.getTileSize().clone();
                internalTileSize.x *= tileResolution;
                internalTileSize.y *= tileResolution;
                var tileSize = this._ts.getTileSize().clone();
                var tileScale = tileResolution / resolution;
                tileSize.x *= tileScale;
                tileSize.y *= tileScale;
                for (k=toDrawLevelTiles.length; k--;) {
                    tile = toDrawLevelTiles[k];
                    tileCoord = tile.tileCoord;
                    canvas.drawImage(
                        tile.image,
                        (tileCoord.x * internalTileSize.x + internalTileOrigin.x - leftTop.x) / resolution,
                        (tileCoord.y * internalTileSize.y + internalTileOrigin.y - leftTop.y) / resolution,
                        tileSize.x,
                        tileSize.y);
                }
            }
        }

        for (j=toLoadLevels.length; j--;) {
            toLoadLevelTiles = toLoadLevels[j];
            sortTiles(toLoadLevelTiles);
            for (k=toLoadLevelTiles.length; k--;) {
                this.loadTile(toLoadLevelTiles[k], this._loader);
            }
        }
    };

    return TileLayer;
});
