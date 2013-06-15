define(function (require){
    var delegate = require('common/util/delegate');
    var inherits = require('common/util/inherits');
    var RenderObject = require('common/render/RenderObject');
    var bind = require('common/function/bind');
    var LinkedMap = require('common/struct/LinkedMap');
    var removeNode = require('common/dom/removeNode');
    var timeStamp = require('common/date/timeStamp');
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

    var USE_WEBGL = WEBKIT;
    var USE_CANVAS = GECKO || IE9P;

    function TileLayer(){
        this._cache = new LinkedMap(1024);
        this._loader = new ImageLoader(5);
        this._preloader = new ImageLoader(1);
        this._blendTime = 1000;

        this.onDropTile = delegate();
        var self = this;
        this._cache.onDrop.addCallback(function (tile){
            self._doOnDropTile(tile);
        });
        this._doOnMapChanges = bind(this._doOnMapChanges, this);
    }
    inherits(TileLayer, RenderObject);

    TileLayer.prototype._blendTime = 1000;

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
                self._cache.set(tile.key, tile);
                if (image) {
                    tile.image = image;
                    tile.loaded = true;
                    self.renderChangesLater();
                }
            }, true);
        }
    };

    TileLayer.prototype.doRenderChanges = function (changes){
        var self = this;
        var cache = this._cache;

        if (this.hasChanges(Changes.SIZE)) {
            var size = this._map.getSize();
            this._canvasElm.width = size.x;
            this._canvasElm.height = size.y;
            this._canvasElm.style.marginLeft = Math.round(- size.x / 2) + 'px';
            this._canvasElm.style.marginTop = Math.round(- size.y / 2) + 'px';
            this._canvas.updateSize();
        }
        this.clear();

        var renderAgain = false;
        var optimalLevel = Math.ceil(this._map.getZoomLevel() - 0.5);
        var bounds = this._map.getInternalBounds();
        var grid = this._computeGird(optimalLevel, bounds);

        var tileCoord = new TileCoord(0, 0, 0);
        var codeMap = {};
        var lowerTiles = {};

        function upHash(tileCoord){
            var key = tileCoord + '';
            if (!codeMap[key]) {
                codeMap[key] = 1;
            } else if (!(codeMap[key] & 0x4)) {
                if (++ codeMap[key] & 0x4) {
                    -- tileCoord.z;
                    tileCoord.x >>= 1;
                    tileCoord.y >>= 1;
                    upHash(tileCoord);
                }
            }
        }

        for (var x=grid.minX; x<=grid.maxX; x++) {
            for (var y=grid.minY; y<=grid.maxY; y++) {
                var key = optimalLevel + '/' + x + '_' + y;
                var tile = cache.get(key);
                if (tile && tile.loaded) {
                    codeMap[key] |= 0x10;
                    upperTiles[key] = tile;
                }
            }
        }

        var lastTiles = this._tiles;
        for (var j=lastTiles.length; j--;) {
            var tile = lastTiles[j];
            var coord = tile.tileCoord;
            tileCoord.z = coord.z;
            if (tile.opacity === 1) {
                if (coord.z === optimalLevel) {
                    codeMap[coord + ''] |= 0x20;
                } else if (coord.z < optimalLevel){
                    tileCoord.z = optimalLevel;
                    tileCoord.x = coord.x << (optimalLevel - coord.z);
                    tileCoord.y = coord.y << (optimalLevel - coord.z);
                    codeMap[tileCoord + ''] |= 0x40;
                    upperTiles[tileCoord + ''] = tile;
                } else if (coord.z > optimalLevel) {
                    upHash(tileCoord);
                    var tiles = lowerTiles[tileCoord + ''] || (lowerTiles[tileCoord + ''] = []);
                    tiles.push(tile);
                }
            }
        }

        var tiles = [];
        var toLoadTiles = [];
        var hash = {};
        var currentTime = timeStamp();
        for (var x=grid.minX; x<=grid.maxX; x++) {
            for (var y=grid.minY; y<=grid.maxY; y++) {
                var key = optimalLevel + '/' + x + '_' + y;
                var code = codeMap[key] | 0;
                if (code & 0x70) {
                    if (!hash[key]) {
                        hash[key] = 1;
                        var tile = upperTiles[key];
                        if (!(code & 0x60)) {
                            tile.opacity = 1;
                        } else {
                            tile.opacity = (currentTime - tile.firstTime) / this._blendTime;
                            tile.firstTime = 1;
                        }
                        tiles.push(upperTiles[key]);
                    }
                } else if (code & 0x7) {
                    tiles.push.apply(tiles, lowerTiles[key]);
                } else {
                    tileCoord.x = x;
                    tileCoord.y = y;
                    tileCoord.z = optimalLevel;
                    var tile = new Tile(tileCoord, this._ts.getTileUrl(tileCoord));
                    toLoadTiles.push(tile);
                }
            }
        }


        for (var j=toLoadTiles.length; j--;) {
            this.loadTile(toLoadTiles[j], this._loader);
        }

        if (renderAgain) {
            this.renderChangesLater();
        }
    };

    return TileLayer;
});
