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

    var USE_WEBGL = false;//test_WEBGL() && !GECKO;
    var USE_CANVAS = true;//test_CANVAS();

    function TileLayer(){
        this._cache = new LinkedMap(1024);
        this._loader = new ImageLoader(5);
        this._preloader = new ImageLoader(1);
        this._rev = 1;
        this._loadUpLevels = 0;
        this._findUpLevels = true;
        this._onlyFindDrawns = true;
        this._findDownLevels = true;
        this._preloadUpLevel = 2;
        this._blend = true;
        this._blendTime = 1000;
        this._alwaysBlend = false;
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
        this._useWebGL = false;//USE_WEBGL && test_CANVAS() && test_WEBGL();
        this._useCanvas = true;//this._useWebGL || (USE_CANVAS && test_CANVAS());
        this._useFlash = false;//!test_CANVAS();
        var pane = this._map.getPanes()["canvas"];
        var canvasElm = document.createElement(this._useCanvas ? 'canvas' : 'div');
        pane.appendChild(canvasElm);
//        canvasElm = uu.canvas.create(1, 1, 'fl', canvasElm);
        canvasElm.style.cssText = 'position:absolute;';
        this._canvasElm = canvasElm;
        if (this._useWebGL) {
            this._canvas = new WebGLCanvas(canvasElm);
        } else if (this._useFlash) {
            this._canvas = new FlashCanvas(canvasElm);
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
        if (ts.isSmooth()) {
            this._alwaysBlend = true;
            this._onlyFindDrawns = false;
            this._findUpLevels = true;
            this._findDownLevels = true;
            this._loadUpLevels = 2;
        } else {
            this._alwaysBlend = false;
            this._onlyFindDrawns = true;
            this._findUpLevels = true;
            this._findDownLevels = true;
            this._loadUpLevels = 0;
        }
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
        // todo:
        if (tile.image) {
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
                tile.loaded = true;
                self._cache.set(tile.key, tile);
                if (image) {
                    tile.image = image;
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
        var zoomLevel = this._map.getZoomLevel();
        var optimalLevel = this._ts.isSmooth() ?
            Math.floor(zoomLevel) : Math.round(zoomLevel);
        var bounds = this._map.getInternalBounds();
        var grid = this._computeGird(optimalLevel, bounds);
        var toDrawLevels = [];
        var toLoadLevels = [];

        function sortTiles(toLoadLevelTiles){
            if (!toLoadLevelTiles.length) return;
            var level = toLoadLevelTiles[0].tileCoord.z;
            var resolution = self._map.getResolution();
            var tileSize = self._ts.getTileSize().clone();
            var tileScale = self._mapType.getResolution(level) / resolution;
            tileSize.x *= tileScale;
            tileSize.y *= tileScale;
            var centerX = (bounds.minX + bounds.maxX) / 2 / resolution - tileSize.x / 2;
            var centerY = (bounds.minY + bounds.maxY) / 2 / resolution - tileSize.y / 2;
            toLoadLevelTiles.sort(function (tile1, tile2){
                var tileCoord1 = tile1.tileCoord;
                var tileCoord2 = tile2.tileCoord;
                var x1 = tileCoord1.x * tileSize.x - centerX;
                var y1 = tileCoord1.y * tileSize.y - centerY;
                var x2 = tileCoord2.x * tileSize.x - centerX;
                var y2 = tileCoord2.y * tileSize.y - centerY;
                return (x2 * x2 + y2 * y2) - (x1 * x1 + y1 * y1);
            });
        }

        var tile;
        var toLoadLevelTiles = [];
        var toDrawLevelTiles = [];
        var seedTiles = [];
        var currentTime = timeStamp();
        var tileCoord = new TileCoord(0, 0, 0);

        var j, k;
        var level;

        var drawnTiles = this._drawnTiles || '';
        var drawnHash = {};
        var bgHash = {};
        for (var j=drawnTiles.length; j--;) {
            var tile = drawnTiles[j];
            if (tile._alpha < 1) continue;
            tileCoord.z = tile.tileCoord.z;
            tileCoord.x = tile.tileCoord.x;
            tileCoord.y = tile.tileCoord.y;
            if (tileCoord.z === optimalLevel) {
                drawnHash[tileCoord + ''] |= 0x10;
            } else if (tileCoord.z < optimalLevel) {
                drawnHash[tileCoord + ''] |= 0x40;
                if (this._findUpLevels) {
                    var shift = optimalLevel - tileCoord.z;
                    var x1 = Math.max(grid.minX, tileCoord.x << shift);
                    var x2 = Math.min(grid.maxX, ((tileCoord.x + 1) << shift) - 1);
                    var y1 = Math.max(grid.minY, tileCoord.y << shift);
                    var y2 = Math.min(grid.maxY, ((tileCoord.y + 1) << shift) - 1);
                    tileCoord.z = optimalLevel;
                    for (var x=x1; x<=x2; x++) {
                        tileCoord.x = x;
                        for (var y=y1; y<=y2; y++) {
                            tileCoord.y = y;
                            var tileKey = tileCoord + '';
                            drawnHash[tileKey] |= 0x20;
                            if (!bgHash[tileKey]) {
                                bgHash[tileKey] = tile.tileCoord.z;
                            } else {
                                bgHash[tileKey] = Math.max(tile.tileCoord.z, bgHash[tileKey]);
                            }
                        }
                    }
                }
            } else {
                if (this._findDownLevels) {
                    var code = 0x01;
                    while (tileCoord.z >= optimalLevel) {
                        drawnHash[tileCoord + ''] |= code;
                        var x1 = tileCoord.x >> 1;
                        var y1 = tileCoord.y >> 1;
                        var x2 = x1 << 1;
                        var y2 = y1 << 1;
                        var count = 0;
                        for (var x=2; x--;) {
                            tileCoord.x = x2 + x;
                            for (var y=2; y--;) {
                                tileCoord.y = y2 + y;
                                if (drawnHash[tileCoord + ''] & 0x05) {
                                    count ++;
                                }
                            }
                        }
                        -- tileCoord.z;
                        tileCoord.x = x1;
                        tileCoord.y = y1;
                        code = count === 4 ? 0x04 : 0x02;
                    }
                }
            }
        }

        toDrawLevelTiles = [];
        tileCoord.z = optimalLevel;
        var currentTime = timeStamp();
        for (var x=grid.minX; x<=grid.maxX; x++) {
            tileCoord.x = x;
            for (var y=grid.minY; y<=grid.maxY; y++) {
                tileCoord.y = y;
                tile = this.getTile(tileCoord);
                var tileKey = tileCoord + '';
                var seed = false;
                if (tile.image) {
                    toDrawLevelTiles.push(tile);
                    var code = drawnHash[tileKey];
                    if (code & 0x24) {
                        if (tile._rev !== this._rev || tile._alpha < 1) {
                            seed = true;
                        }
                    } else {
                        tile._noAlpha = true;
                    }
                } else {
                    seed = true;
                    if (!tile.loaded) {
                        toLoadLevelTiles.push(tile);
                    }
                }
                if (seed) {
                    seedTiles.push(tile);
                }
            }
        }
        toDrawLevels.push(toDrawLevelTiles);
        toLoadLevels.push(toLoadLevelTiles);

        if (this._findDownLevels) {
            var oldSeedTiles = seedTiles;
            seedTiles = oldSeedTiles.slice(0);
            var newSeedTiles = [];
            for (var j=seedTiles.length; j--;) {
                var tile = seedTiles[j];
                if (!(drawnHash[tile.key] & 0x04)) {
                    newSeedTiles.push(tile);
                }
            }
            var maxLevel = this._mapType.getMaxLevel();
            for (level=optimalLevel+1; seedTiles.length&&level<=maxLevel; level++) {
                toDrawLevelTiles = [];
                var prevSeedTiles = seedTiles;
                seedTiles = [];
                tileCoord.z = level;
                for (j=prevSeedTiles.length; j--;) {
                    var seedTile = prevSeedTiles[j];
                    var code = drawnHash[seedTile.key];
                    if (code & 0x07) {
                        var x1 = seedTile.tileCoord.x << 1;
                        var y1 = seedTile.tileCoord.y << 1;
                        for (var x=2; x--;) {
                            tileCoord.x = x1 + x;
                            for (var y=2; y--;) {
                                tileCoord.y = y1 + y;
                                var tileKey = tileCoord + '';
                                var cachedTile = cache.peekValue(tileKey);
                                if ((drawnHash[tileKey] & 0x05) && cachedTile && cachedTile.image) {
                                    cachedTile._noAlpha = true;
                                    toDrawLevelTiles.push(cachedTile);
                                } else {
                                    seedTiles.push(new Tile(tileCoord.clone(), ''));
                                }
                            }
                        }
                    }
                }
                toDrawLevels.push(toDrawLevelTiles);
            }
            seedTiles = newSeedTiles;
        }

        if (this._findUpLevels) {
            var minLevel = this._mapType.getMinLevel();
            var stopLoadLevel = Math.max(minLevel, optimalLevel - this._loadUpLevels);
            for (level=optimalLevel-1; seedTiles.length&&(level>=minLevel); level--) {
                var stillLoad = level >= stopLoadLevel;
                toLoadLevelTiles = [];
                toDrawLevelTiles = [];
                var hash = {};
                var prevSeedTiles = seedTiles;
                seedTiles = [];
                for (j=prevSeedTiles.length; j--;) {
                    var prevTile = prevSeedTiles[j];
                    tileCoord.z = level;
                    tileCoord.x = prevTile.tileCoord.x >> 1;
                    tileCoord.y = prevTile.tileCoord.y >> 1;
                    tile = this.getTile(tileCoord, !stillLoad);
                    if (!hash[tile.key]) {
                        hash[tile.key] = 1;
                        var seed = false;
                        if (tile.image && (!this._onlyFindDrawns || (drawnHash[tile.key] & 0x40))) {
                            tileCoord.x = Math.min(grid.maxX, Math.max(grid.minX, tileCoord.x << (optimalLevel - level)));
                            tileCoord.y = Math.min(grid.maxY, Math.max(grid.minY, tileCoord.y << (optimalLevel - level)));
                            tileCoord.z = optimalLevel;
                            var tileKey = tileCoord + '';
                            if (typeof bgHash[tileKey] === 'number' &&
                                tile.tileCoord.z > bgHash[tileKey]) {
                                seed = true;
                            } else {
    //                            seed = true;
                                tile._noAlpha = true;
                            }
                            toDrawLevelTiles.push(tile);
                        } else {
                            seed = true;
                            if (stillLoad && !tile.loaded) {
                                toLoadLevelTiles.push(tile);
                            }
                        }
                        if (seed) {
                            seedTiles.push(tile);
                        }
                    }
                }
                if (toDrawLevelTiles.length) {
                    toDrawLevels.push(toDrawLevelTiles);
                }
                if (stillLoad && toLoadLevelTiles.length) {
                    toLoadLevels.push(toLoadLevelTiles);
                }
            }
        }

        var resolution = this._map.getResolution();
        var leftTop = bounds.getMin();
        var canvas = this._canvas;
        var drawnTiles = [];
        var oldRev = this._rev;
        this._rev ++;
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
                    var coord = tile.tileCoord;
                    var alpha = 1;
                    if (!tile._drawInTime || (this._alwaysBlend && tile._rev !== oldRev)) {
                        tile._drawInTime = currentTime;
                    }
                    tile._rev = this._rev;
                    if (this._blend && !tile._noAlpha) {
                        var levelDelta = Math.max(0, Math.abs(coord.z - zoomLevel) - 1);
                        var factor = 1 / Math.pow(1.32, levelDelta);
                        alpha = (Math.min(1, (currentTime - tile._drawInTime) / (this._blendTime * factor)));
                        if (alpha !== 1) {
                            renderAgain = true;
                        }
                    } else {
                        tile._noAlpha = false;
                    }
                    tile._alpha = alpha;
                    if (alpha !== 0 && tile.image) {
                        canvas.drawImage(
                            tile.image,
                            (coord.x * internalTileSize.x + internalTileOrigin.x - leftTop.x) / resolution,
                            (coord.y * internalTileSize.y + internalTileOrigin.y - leftTop.y) / resolution,
                            tileSize.x,
                            tileSize.y,
                            alpha);
                    }
                    drawnTiles.push(tile);
                }
            }
        }

        this._drawnTiles = drawnTiles;

        for (j=toLoadLevels.length; j--;) {
            toLoadLevelTiles = toLoadLevels[j];
            sortTiles(toLoadLevelTiles);
            for (k=toLoadLevelTiles.length; k--;) {
                this.loadTile(toLoadLevelTiles[k], this._loader);
            }
        }
        soso.maps.$timeline.stop();
        soso.maps.$timeline.start();

        if (this._preloadUpLevel && optimalLevel - this._preloadUpLevel > minLevel) {

        }
//        if (optimalLevel - 2 > minLevel) {
//            // todo: 只预加载外圈.
//            var preloadBounds = bounds.clone();
//            preloadBounds.minX -= 256 * resolution;
//            preloadBounds.maxX += 256 * resolution;
//            preloadBounds.minY -= 256 * resolution;
//            preloadBounds.maxY += 256 * resolution;
//            var grid = this._computeGird(optimalLevel - 2, preloadBounds);
//            tileCoord.z = optimalLevel;
//            for (var x=grid.minX; x<=grid.maxX; x++) {
//                tileCoord.x = x;
//                for (var y=grid.minY; y<=grid.maxY; y++) {
//                    tileCoord.y = y;
//                    var tileKey = tileCoord + '';
//                    if (!cache.peekValue(tileKey)) {
//                        var tile = new Tile(tileCoord.clone(), this._ts.getTileUrl(tileCoord));
//                        this.loadTile(tile, this._preloader);
//                    }
//                }
//            }
//        }
        canvas.beforeExitFrame();

        if (renderAgain) {
            this.renderChangesLater();
        }
    };

    return TileLayer;
});
