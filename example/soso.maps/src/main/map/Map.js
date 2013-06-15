define(function (require){
    var delegate = require('common/util/delegate');
    var inherits = require('common/util/inherits');
    var RenderObject = require('common/render/RenderObject');
    var getUid = require('common/object/getUid');
    var getKeys = require('common/object/getKeys');
    var getValues = require('common/object/getValues');
    var clamp = require('common/math/clamp');
    var IE = require('common/browser/IE');
    var Dragger = require('common/dom/Dragger');
    var addListener = require('common/dom/event/addListener');
    var MOUSE_WHEEL = require('common/dom/event/MOUSE_WHEEL');
    var getWheelDelta = require('common/dom/event/getWheelDelta');
    var Animation = require('common/fx/Animation');
    var LINEAR = require('common/fx/tween/LINEAR');
    var EASE_IN_OUT_CIRC = require('common/fx/tween/EASE_IN_OUT_CIRC');
    var SPRING = require('common/fx/tween/BING');
    var EASE_OUT = require('common/fx/tween/EASE_OUT');
    var timeStamp = require('common/date/timeStamp');
    var renderMgr = require('common/render/renderMgr');

    var Point = require('soso.maps/geom/Point');
    var Bounds = require('soso.maps/geom/Bounds');
    var LatLng = require('soso.maps/geo/LatLng');
    var LatLngBounds = require('soso.maps/geo/LatLngBounds');
    var MapType = require('soso.maps/type/MapType');
    var Changes = require('soso.maps/map/Changes');
    var Magnifier = require('soso.maps/map/Magnifier');
    var ZoomIndicator = require('soso.maps/control/ZoomIndicator');

    var defaultMapType = new MapType();

    function Map(div){
        this._renderChangesHandlers = {};
        this._mapTypes = {};
        this._controlPoints = new ControlPoints(this);
        this._dragEnabled = true;
        this.onReady = delegate();
        this.doStopAnims = delegate();

        div.innerHTML = '' +
            '<div style="position:relative;height:100%;overflow:hidden;">' +
                '<div style="position:absolute;left:50%;top:50%;"></div>' +
                '<div tabindex="-1" style="position:absolute;left:0;top:0;width:100%;height:100%;"></div>' +
                '<div style="position:absolute;left:50%;top:50%;">' +
                    '<div style="position:absolute;left:0;top:0;">' +
                        '<div></div>' +
                        '<div></div>' +
                        '<div></div>' +
                        '<div></div>' +
                        '<div></div>' +
                        '<div></div>' +
                    '</div>' +
                '</div>' +
                '<span></span>' +
            '</div>';
        var viewElm = div.firstChild;
        var canvasElm = viewElm.firstChild;
        var maskElm = canvasElm.nextSibling;
//        maskElm.style.backgroundColor = 'transparent';
        if (IE) {
            maskElm.style.backgroundImage = 'url("about:blank")';
        }
        maskElm.unselectable = 'on';
        var centerElm = maskElm.nextSibling;
        var controlElm = centerElm.nextSibling;
        var originElm = centerElm.firstChild;
        var divs = originElm.getElementsByTagName('div');
        this._viewElm = viewElm;
        this._maskElm = maskElm;
        this._originElm = originElm;
        this._panes = {
            "canvas": canvasElm,
            "overlay": divs[0],
            "overlayShadow": divs[1],
            "overlayImage": divs[2],
            "floatShadow": divs[3],
            "overlayMouseTarget": divs[4],
            "float": divs[5],
            "control": controlElm
        };
        this._initDragPan();
        this._initWheelZoom();
        this._initDoubleClickZoom();
        this._initAutoUpdateSize();

        this._setMapType(defaultMapType);
        this.unsetChanges(Changes.MAP_TYPE);
        this.updateSize();
        new Magnifier(this);
    }
    inherits(Map, RenderObject);

    Map.prototype._ready = false;
    Map.prototype._internalCenter = null;
    Map.prototype._internalOrigin = null;
    Map.prototype._center = null;
    Map.prototype._projection = null;
    Map.prototype._resolution = NaN;
    Map.prototype._projectedWorldWidth = NaN;
    Map.prototype._mapTypes = null;
    Map.prototype._mapType = null;
    Map.prototype._mapTypeId = null;
    Map.prototype._zoomLevel = NaN;
    Map.prototype._size = new Point(NaN, NaN);
    Map.prototype._baseLayer = null;

    Map.prototype._zoomAtMouse = true;

    //region ### mapTypes ###
    Map.prototype.bindMapType = function (mapTypeId, mapType){
        if (mapType) {
            this._mapTypes[mapTypeId] = mapType;
        } else {
            delete this._mapTypes[mapTypeId];
        }
        if (!this._mapTypeId) {
            this._mapTypeId = mapTypeId;
            this._setMapType(mapType);
        }
    };
    Map.prototype.getMapType = function (){
        return this._mapType;
    };
    Map.prototype._setMapType = function (mapType){
        if (mapType !== this._mapType) {
            this._mapType = mapType;
            var projection = mapType.getProjection();
            if (projection !== this._projection) {
                this._projection = projection;
                this.setChanges(Changes.PROJECTION);
            }
            this.setZoomLevel(this._zoomLevel);
            this._setBaseLayer(mapType.fixLayer(this._baseLayer));
            this.setChanges(Changes.MAP_TYPE);
        }
    };
    Map.prototype._setBaseLayer = function (layer){
        if (layer !== this._baseLayer) {
            if (this._baseLayer) {
                this._baseLayer.setMap(null);
            }
            if (layer) {
                layer.setMap(this);
            }
            this._baseLayer = layer;
        }
    };
    Map.prototype.getMapTypeId = function (){
        return this._mapTypeId;
    };
    Map.prototype.setMapTypeId = function (mapTypeId){
        this._mapTypeId = mapTypeId;
        this._setMapType(this._mapTypes[mapTypeId] || null);
    };
    //endregion

    //region ### getters & setters ###
    Map.prototype.getPanes = function (){
        return this._panes;
    };

    Map.prototype.getResolution = function (){
        return this._resolution;
    };

    Map.prototype.getZoomLevel = function (){
        return this._zoomLevel;
    };

    Map.prototype.setZoomLevel = function (level){
        var mapType = this._mapType;
        level = clamp(level, mapType.getMinLevel(), mapType.getMaxLevel());
        if (level !== this._zoomLevel) {
            this._zoomLevel = level;
            this.setChanges(Changes.ZOOM_LEVEL);
            if (this._mapType) {
                this._resolution = this._mapType.getResolution(level)
            }
        }
    };

    Map.prototype.getCenter = function (){
        return this._center || (this._center =
                this._projection.inverse(this._internalCenter));
    };

    Map.prototype.setCenter = function (center){
        this.setInternalCenter(this._projection.forward(center));
        this._center = center.clone();
    };

    Map.prototype.setInternalCenter = function (pointCenter){
        if (!this._internalCenter ||
            !this._internalCenter.equals(pointCenter)) {
            this._center = null;
            this._internalCenter = pointCenter.clone();
            if (!this._internalOrigin) {
                this._internalOrigin = pointCenter;
                this.setChanges(Changes.ORIGIN);
            }
            this.setChanges(Changes.CENTER);
        }
    };

    Map.prototype._getBounds = function (projection){
        var p1 = this.getInternalPointAtViewportPixel(new Point(0, 0));
        var p2 = this.getInternalPointAtViewportPixel(this._size);
        if (projection) {
            p1 = projection.inverse(p1);
            p2 = projection.inverse(p2);
            return projection.fixBounds(p1, p2);
        }
        return new Bounds(p1.x, p1.y, p2.x, p2.y);
    };

    Map.prototype.getInternalBounds = function (){
        return this._getBounds(null);
    };
    Map.prototype.getBounds = function (){
        return this._getBounds(this._projection);
    };
    Map.prototype.getSize = function (){
        return this._size.clone();
    };
    //endregion

    Map.prototype.getInternalPointAtViewportPixel = function (pixel){
        var center = this._internalCenter;
        var size = this._size;
        var resolution = this._resolution;
        return new Point(
            center.x + (pixel.x - size.x / 2) * resolution,
            center.y + (pixel.y - size.y / 2) * resolution
        );
    };

    Map.prototype.getViewportPixelAtInternalPoint = function (point){
        var center = this._internalCenter;
        var size = this._size;
        var resolution = this._resolution;
        return new Point(
            size.x / 2 + (point.x - center.x) / resolution,
            size.y / 2 + (point.y - center.y) / resolution
        );
    };

    Map.prototype.getViewportPixelOfWindowPixel = function (pixel){
        var bcr = this._viewElm.getBoundingClientRect();
        this._updateSize(bcr);
        return new Point(pixel.x - bcr.left, pixel.y - bcr.top);
    };

    Map.prototype.getPointAtViewportPixel = function (pixel){
        return this._projection.inverse(this.getInternalPointAtViewportPixel(pixel.clone()));
    };

    Map.prototype.setInternalPointAtViewportPixel = function (point, pixel){
        var currentPixel = this.getViewportPixelAtInternalPoint(point);
        this._panBy(currentPixel.x - pixel.x, currentPixel.y - pixel.y);
    };

    //region ### rendering ###
    Map.prototype._doReady = function (){
        this._ready = true;
        this._resolution = this._mapType.getResolution(this._zoomLevel);
        this.onReady();
    };

    var READY_FIELDS = Changes.CENTER | Changes.ZOOM_LEVEL | Changes.MAP_TYPE | Changes.SIZE;
    var ORIGIN_PIXEL = Changes.CENTER | Changes.ORIGIN | Changes.ZOOM_LEVEL;

    Map.prototype.beforeRenderChanges = function (){
        if (!this._ready) {
            if (!this.hasChanges(READY_FIELDS)) {
                return false;
            }
            this._doReady();
        }
        if (this.hasAnyChanges(ORIGIN_PIXEL)) {
            var center = this._internalCenter;
            var origin = this._internalOrigin;
            var resolution = this._resolution;
            var pixelX = (center.x - origin.x) / resolution;
            var pixelY = (center.y - origin.y) / resolution;
            // 1342177
            if (!(Math.abs(pixelX) < 1E6 && Math.abs(pixelY) < 1E6)) {
                pixelX = 0;
                pixelY = 0;
                this._internalOrigin = center;
                this.setChanges(Changes.ORIGIN);
            }
            this._pixelCenterToOrigin = new Point(pixelX, pixelY);
        }
        this._controlPoints.apply();
    };

    Map.prototype.doRenderChanges = function (){
        if (this.hasAnyChanges(ORIGIN_PIXEL)) {
            this._renderOriginPixel();
        }

        var handlersMap = this._renderChangesHandlers;
        var keys = getKeys(handlersMap);
        for (var j=keys.length; j--;) {
            var key = keys[j];
            var changes = this.hasAnyChanges(Number(key));
            if (changes) {
                var handlers = getValues(handlersMap[key]);
                for (var k=handlers.length; k--;) {
                    handlers[k].call(this, changes);
                }
            }
        }
    };

    Map.prototype.addRenderChangesHandler = function (changes, callback){
        var handlers = this._renderChangesHandlers;
        handlers = handlers[changes] || (handlers[changes] = {});
        handlers[getUid(callback)] = callback;
    };

    Map.prototype.removeRenderChangesHandler = function (changes, callback){
        var handlers = this._renderChangesHandlers[changes];
        if (handlers) {
            delete handlers[getUid(callback)];
        }
    };

    Map.prototype._renderOriginPixel = function (){
        var originElm = this._originElm;
        originElm.style.left = this._pixelCenterToOrigin.x + 'px';
        originElm.style.top = this._pixelCenterToOrigin.y + 'px';
    };

    Map.prototype._updateSize = function (bcr){
        var size = new Point(bcr.right - bcr.left, bcr.bottom - bcr.top);
        if (!size.equals(this._size)) {
            this._size = size;
            this.setChanges(Changes.SIZE);
        }
    };

    Map.prototype.updateSize = function (){
        this._updateSize(this._viewElm.getBoundingClientRect());
    };
    //endregion

    Map.prototype._panBy = function (dx, dy){
        if (dx || dy) {
            var center = this._internalCenter;
            var resolution = this._resolution;
            center.x += dx * resolution;
            center.y += dy * resolution;
            this._center = null;
            this.setChanges(Changes.CENTER);
        }
    };
    Map.prototype.panBy = function (dx, dy){
        this._panBy(dx, dy);
    };

    Map.prototype.flyTo = function (targetCenter, targetZoom, tween){
        var self = this;
        targetCenter = targetCenter == null ? this.getCenter() : targetCenter;
        targetZoom = targetZoom == null ? this.getZoomLevel() : targetZoom;
        tween = tween || EASE_OUT;

        // inspired from https://github.com/mapbox/easey/blob/gh-pages/src/easey.js
        var V = 0.9;
        var rho = 1.42;

        function sqr(n){ return n * n; }
        function sinh(n){ return (Math.exp(n) - Math.exp(-n)) / 2; }
        function cosh(n){ return (Math.exp(n) + Math.exp(-n)) / 2; }
        function tanh(n){ return sinh(n) / cosh(n); }

        var projection = this.getMapType().getProjection();
        var sourcePoint = projection.forward(this.getCenter());
        var targetPoint = projection.forward(targetCenter);
        var sourceZoom = this.getZoomLevel();

        var leftTop = this.getInternalPointAtViewportPixel(new Point(0, 0));
        var rightBottom = this.getInternalPointAtViewportPixel(this.getSize());
        var w0 = Math.max(Math.abs(rightBottom.x - leftTop.x), Math.abs(rightBottom.y - leftTop.y));
        var w1 = w0 * Math.pow(2, sourceZoom - targetZoom);
        var u0 = 0;
        var u1 = Math.sqrt(sqr(sourcePoint.x - targetPoint.x) + sqr(sourcePoint.y - targetPoint.y));

        function b(i){
            var n = sqr(w1) - sqr(w0) + (i ? -1: 1) * Math.pow(rho, 4) * sqr((u1 - u0)),
                d = 2 * (i ? w1 : w0) * sqr(rho) * (u1 - u0);
            return n/d;
        }
        function r(i){
            return Math.log(-b(i) + Math.sqrt(sqr(b(i)) + 1));
        }

        var r0 = r(0);
        var r1 = r(1);
        var S = (r1 - r0) / rho;

        var w = function (s){
            return w0 * cosh(r0) / cosh (rho * s + r0);
        };
        var u = function (s){
            return (w0 / sqr(rho)) * cosh(r0) * tanh(rho * s + r0) - (w0 / sqr(rho)) * sinh(r0) + u0;
        };
        if (u1 < 0.000001) {
            if (Math.abs(w0 - w1) < 0.000001) {
                return;
            }
            var k = sourceZoom < targetZoom ? -1 : 1;
            S = Math.abs(Math.log(w1 / w0)) / rho;
            u = function (s){
                return u0;
            };
            w = function (s){
                return w0 * Math.exp(k * rho * s);
            };
        }

        function interp(a, b, p) {
            if (p === 0) return a;
            if (p === 1) return b;
            return a + ((b - a) * p);
        }
        var anim = this._zoomAnim;
        if (anim) {
            anim.stop();
        }
        anim = new Animation();
        this._zoomAnim = anim;

        anim.setDuration(S / V * 1000);
        anim.setBeginValues([]);
        anim.setEndValues([]);
        anim.setApplier(function (values, elapsedTime){
            var position = tween(anim.getPosition(elapsedTime));
            var s = position * S;
            var k = u(s) / u1;
            k = isNaN(k) ? 1 : k;
            var p = new Point(
                interp(sourcePoint.x, targetPoint.x, k),
                interp(sourcePoint.y, targetPoint.y, k));
            self.setCenter(projection.inverse(p));
            self.setZoomLevel(sourceZoom + Math.log(w0 / w(s)) / Math.LN2);
        });
        anim.start();
    };

    Map.prototype.zoomTo = function (targetLevel, immediate, focusLocation, moveToCenter, duration, tween){
        var focusPoint;
        var focusPixel;
        if (focusLocation && !(immediate && moveToCenter)) {
            focusPoint = this.getMapType().getProjection().forward(focusLocation);
            focusPixel = this.getViewportPixelAtInternalPoint(focusPoint);
        }
        if (immediate) {
            this.setZoomLevel(targetLevel);
            if (moveToCenter) {
                this.setCenter(focusLocation);
            } else {
                this.setInternalPointAtViewportPixel(focusPoint, focusPixel);
            }
            return;
        }
        if (this._zoomAnim) {
            this._zoomAnim.stop();
            this._zoomAnim = null;
        }
        var self = this;
        var currentLevel = this.getZoomLevel();
        var anim = new Animation();
        this._zoomAnim = anim;
        this._targetLevel = targetLevel;
        anim.setDuration(duration || 500);
        anim.setTween(tween || EASE_IN_OUT_CIRC);
        var begins = [currentLevel];
        var ends = [targetLevel];
        if (moveToCenter) {
            begins.push(focusPixel.x, focusPixel.y);
            ends.push(this.getSize().x / 2, this.getSize().y / 2);
        }
        anim.setBeginValues(begins);
        anim.setEndValues(ends);
        self._zoomIndicator = new ZoomIndicator();
        self._zoomIndicator.render(self.getPanes()['control']);
        // todo: resize update endValues.
        anim.setApplier(function (values){
            var level = values[0];
            var exit = false;
            if (level < self.getMapType().getMinLevel()) {
                level = self.getMapType().getMinLevel();
                exit = true;
            } else if (level > self.getMapType().getMaxLevel()) {
                level = self.getMapType().getMaxLevel();
                exit = true;
            }
            var focusPixel = focusPoint ? (!moveToCenter ?
                self.getViewportPixelAtInternalPoint(focusPoint) : new Point(values[1], values[2])) :
                new Point(self.getSize().x / 2, self.getSize().y / 2);
            self.setZoomLevel(level);
            if (focusPoint) {
                self.setInternalPointAtViewportPixel(focusPoint, focusPixel);
            }
            self._zoomIndicator.update(
                focusPixel,
                self.getZoomLevel(),
                self._targetLevel >= self.getZoomLevel());
            self._controlPoints.apply();
            if (!moveToCenter && exit) {
                return false;
            }
        });
        anim.onEnd.addCallback(function (){
            self._zoomAnim = null;
            self._targetLevel = null;
            self._zoomIndicator.destroy();
            self._zoomIndicator = null;
        });
        anim.start();
        return anim;
    };

    Map.prototype.zoomBy = function (delta, immediate, focusLocation, moveToCenter, duration, tween){
        var targetLevel = this._targetLevel;
        var currentLevel = this.getZoomLevel();
        if (targetLevel != null && (targetLevel - currentLevel >= 0) === (delta >= 0)) {
            targetLevel = targetLevel + delta;
        } else {
            targetLevel = currentLevel + delta;
        }
        this.zoomTo(targetLevel, immediate, focusLocation, moveToCenter, duration, tween);
    };

    Map.prototype._initAutoUpdateSize = function (){
        var self = this;
        addListener(window, 'resize', function (){
            self.updateSize();
        });
        setTimeout(function (){
            self.updateSize();
            setTimeout(arguments.callee, 128);
        }, 128);
    };

    Map.prototype._initDragPan = function (){
        var self = this;
        var dragger = new Dragger();
        dragger.listen(self._maskElm);
        var draggingPixel;
        var draggintTime;
        var speedV;
        dragger.onDragStart.addCallback(function (clientX, clientY, evt){
            if (!self._dragEnabled || evt.ctrlKey) {
                return false;
            }
            var pixel = self.getViewportPixelOfWindowPixel(new Point(clientX, clientY));
            var dragginPoint = self.getInternalPointAtViewportPixel(pixel);
            self._controlPoints.dragStart(dragginPoint, pixel);
            draggingPixel = pixel;
            draggintTime = timeStamp();
            speedV = new Point(0, 0);
        });
        dragger.onDragMove.addCallback(function (clientX, clientY){
            var pixel = self.getViewportPixelOfWindowPixel(new Point(clientX, clientY));
            self._controlPoints.dragMove(pixel);
            self.renderChangesLater();
            var time = timeStamp();
            var d = time - draggintTime;
            speedV = new Point(
                (pixel.x - draggingPixel.x) / d,
                (pixel.y - draggingPixel.y) / d);
            draggingPixel = pixel;
            draggintTime = time;
        });
        dragger.onDragEnd.addCallback(function (){
            self._controlPoints.dragEnd();
            var time = timeStamp();
            if (time - draggintTime <= 60) {
                self.panByInertial(speedV.x, speedV.y);
            }
        });
        self._dragger = dragger;
    };

    function getSpeed(vx, vy){
        return Math.sqrt(vx * vx + vy * vy);
    }


    var k = 0.006;
    var c = 0.0006;
    function getDuration(v0){
        return Math.atan(Math.sqrt(k/c)*v0)/Math.sqrt(k*c);
    }
    function f(v0, t){
        return (1/k)*Math.log(Math.abs(Math.cos(-Math.sqrt(k*c)*t+Math.atan(Math.sqrt(k/c)*v0))));
    }
    function getOffset(v0, t){
        return f(v0, t) - f(v0, 0);
    }

    Map.prototype.panByInertial = function (vx, vy){
        var self = this;
        self.stopAnimations();
        if (self._inertialAnim) {
            self._inertialAnim.stop();
            self._inertialAnim = null;
        }
        var speed = getSpeed(vx, vy);
        speed = Math.sqrt(speed) / 2;
        vx /= speed;
        vy /= speed;
        if (speed <= 0) {
            return;
        }
        var duration = getDuration(speed);
        var anim = new Animation();
        anim.setDuration(duration);
        anim.setPosition(0);
        anim.setTween(LINEAR);
        anim.setBeginValues([]);
        anim.setEndValues([]);
        var passed = 0;
        anim.setApplier(function (values, elapsedTime){
            var offset = getOffset(speed, elapsedTime);
            var shift = offset - passed;
            self.panBy(-vx * shift, -vy * shift);
            passed = offset;
        });
        self._inertialAnim = anim;
        anim.onEnd.addCallback(function (){
            self._inertialAnim = null;
        });
        anim.start();
    };

    Map.prototype.setDragEnabled = function (value){
        this._dragEnabled = value;
    };

    Map.prototype._initWheelZoom = function (){
        var self = this;
        var viewElm = self._viewElm;
        addListener(viewElm, MOUSE_WHEEL, function (evt){
            var delta = getWheelDelta(evt) / 120;
            var pixel = self.getViewportPixelOfWindowPixel(new Point(evt.clientX, evt.clientY));
            var focusLocation;
            if (self._zoomAtMouse) {
                var focusPoint = self.getInternalPointAtViewportPixel(pixel);
                focusLocation = self.getMapType().getProjection().inverse(focusPoint);
            }
            self.zoomBy(delta, false, focusLocation, false, 1000, SPRING);
        });
        var touching = false;
        var startDistance = 0;
        var startZoom = 0;
        addListener(viewElm, 'touchstart', function (evt){
            if (!touching) {
                var focusPixel;
                if (evt.touches.length === 1) {
                    touching = true;
                    var p = evt.touches[0];
                    focusPixel = new Point(p.clientX, p.clientY);
                    focusPixel = self.getViewportPixelOfWindowPixel(focusPixel);
                    startDistance = 0;
                } else if (evt.touches.length === 2) {
                    touching = true;
                    var p1 = evt.touches[0];
                    var p2 = evt.touches[1];
                    startDistance = Math.max(20, Math.sqrt(
                        Math.pow(p1.screenX - p2.screenX, 2),
                        Math.pow(p1.screenY - p2.screenY, 2)));
                    focusPixel = new Point(
                        (p1.clientX + p2.clientX) / 2,
                        (p1.clientY + p2.clientY) / 2);
                    focusPixel = self.getViewportPixelOfWindowPixel(focusPixel);
                }
                startZoom = self.getZoomLevel();
                var focusPoint = self.getInternalPointAtViewportPixel(focusPixel);
                self._controlPoints.dragStart(focusPoint, focusPixel);
            }
            evt.preventDefault();
        });
        addListener(viewElm, 'touchend', function (evt){
            if (touching) {
                self._controlPoints.dragEnd();
                touching = false;
            }
            evt.preventDefault();
        });
        addListener(viewElm, 'touchmove', function (evt){
            if (touching) {
                var focusPixel;
                if (evt.touches.length === 1) {
                    var p = evt.touches[0];
                    focusPixel = new Point(p.clientX, p.clientY);
                    focusPixel = self.getViewportPixelOfWindowPixel(focusPixel);
                } else if (evt.touches.length === 2) {
                    var p1 = evt.touches[0];
                    var p2 = evt.touches[1];
                    var distance = Math.max(20, Math.sqrt(
                        Math.pow(p1.screenX - p2.screenX, 2),
                        Math.pow(p1.screenY - p2.screenY, 2)));
                    focusPixel = new Point(
                        (p1.clientX + p2.clientX) / 2,
                        (p1.clientY + p2.clientY) / 2);
                    focusPixel = self.getViewportPixelOfWindowPixel(focusPixel);
                    if (!startDistance) {
                        startDistance = distance;
                        var focusPoint = self.getInternalPointAtViewportPixel(focusPixel);
                        self._controlPoints.dragStart(focusPoint, focusPixel);
                    }
                    console.log(distance);
                }
                if (startDistance) {
                    self.setZoomLevel(startZoom + Math.log(distance / startDistance) / Math.LN2);
                }
                self._controlPoints.dragMove(focusPixel);
                self.renderChangesLater();
            }
            evt.preventDefault();
        });
    };

    Map.prototype._initDoubleClickZoom = function (){
        var self = this;
        var anim;
        addListener(this._maskElm, 'dblclick', function (evt){
            var pixel = self.getViewportPixelOfWindowPixel(new Point(evt.clientX, evt.clientY));
            var point = self.getInternalPointAtViewportPixel(pixel);
            var focusLocation = self.getMapType().getProjection().inverse(point);
            var targetLevel = Math.ceil(self.getZoomLevel() + 1);
            self.zoomTo(targetLevel, false, focusLocation);
        });
    };

    Map.prototype.stopAnimations = function (){
        this.doStopAnims();
    };

    function ControlPoints(map){
        this._map = map;
    }

    ControlPoints.prototype.isDragging = function (){
        return this._dragging;
    };
    ControlPoints.prototype.dragStart = function (point, pixel){
        this._dragging = true;
        this._draggingPoint = point;
        this._draggingPixel = pixel;
    };
    ControlPoints.prototype.dragMove = function (pixel){
        this._draggingPixel = pixel;

    };
    ControlPoints.prototype.dragEnd = function (){
        this._draggingPoint = null;
        this._draggingPixel = null;
        this._dragging = false;
    };
    ControlPoints.prototype.apply = function (){
        if (this._dragging) {
            this._map.setInternalPointAtViewportPixel(this._draggingPoint, this._draggingPixel);
        }
    };
    return Map;
});
