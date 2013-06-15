define(function (require){
    var Dragger = require('common/dom/Dragger');
    var Point = require('soso.maps/geom/Point');
    var Bounds = require('soso.maps/geom/Bounds');
    var MapChanges = require('soso.maps/map/Changes');
    var EASE_IN_OUT_CIRC = require('common/fx/tween/EASE_IN_OUT_CIRC');

    function Magnifier(map){
        var dragger = new Dragger();
        dragger.listen(map._maskElm);
        var startPixel;
        var startPoint;
        var endPixel;
        var endPoint;
        var rect;
        var bounds;
        var dashedRect;
        var rectOpacity;
        dragger.onDragStart.addCallback(function (clientX, clientY, evt){
            if (!evt.ctrlKey) {
                return false;
            }
            startPixel = map.getViewportPixelOfWindowPixel(new Point(clientX, clientY));
            rectOpacity = 0.3;
        });
        dragger.onDragMove.addCallback(function (clientX, clientY){
            endPixel = map.getViewportPixelOfWindowPixel(new Point(clientX, clientY));
            rect = new Bounds(
                Math.min(startPixel.x, endPixel.x),
                Math.min(startPixel.y, endPixel.y),
                Math.max(startPixel.x, endPixel.x),
                Math.max(startPixel.y, endPixel.y)
            );
            renderRectangle();
        });
        dragger.onDragEnd.addCallback(function (){
            startPoint = map.getInternalPointAtViewportPixel(startPixel);
            endPoint = map.getInternalPointAtViewportPixel(endPixel);
            bounds = new Bounds(
                Math.min(startPoint.x, endPoint.x),
                Math.min(startPoint.y, endPoint.y),
                Math.max(startPoint.x, endPoint.x),
                Math.max(startPoint.y, endPoint.y)
            );
            if (!isValid()) {
                return;
            }
            var span = rect.toSpan();
            var size = map.getSize();
            var scale = Math.min(size.x / span.x, size.y / span.y);
            var targetLevel = map.getZoomLevel() + Math.log(scale) / Math.LN2;
            var rectCenter = rect.getCenter();
            var viewCenter = new Point(size.x / 2, size.y / 2);
            var centerPoint = bounds.getCenter();
            var centerLocation = map.getMapType().getProjection().inverse(centerPoint);
            var zoomAnim = map.zoomTo(targetLevel, false, centerLocation, true);
            zoomAnim.onFrame.addCallback(function (pos){
                compute();
                rectOpacity = 0.1 + (0.3 - 0.1) * (1 - pos);
                console.log(pos);
                renderRectangle();
            });
            map.setDragEnabled(false);
            zoomAnim.onEnd.addCallback(function (atEnd){
                zoomAnim.onEnd.removeCallback(arguments.callee);
                if (atEnd) {
                    setTimeout(function (){
                        if (map._magRectElm) {
                            map._magRectElm.style.display = 'none';
                        }
                    }, 200);
                } else {
                    map._magRectElm.style.display = 'none';
                }
                map.setDragEnabled(true);
            });
        });
        function compute(){
            startPixel = map.getViewportPixelAtInternalPoint(startPoint);
            endPixel = map.getViewportPixelAtInternalPoint(endPoint);
            rect = new Bounds(
                Math.min(startPixel.x, endPixel.x),
                Math.min(startPixel.y, endPixel.y),
                Math.max(startPixel.x, endPixel.x),
                Math.max(startPixel.y, endPixel.y)
            );
        }
        function isValid(){
            return rect.maxX - rect.minX > 5 &&
                rect.maxY - rect.minY > 5;
        }
        function renderRectangle(){
            var magRectElm = map._magRectElm;
            if (!magRectElm) {
                magRectElm = document.createElement('div');
                magRectElm.style.cssText = 'position:absolute;border:2px solid orange;background-color:yellow;';
                map._viewElm.appendChild(magRectElm);
                map._magRectElm = magRectElm;
            }
            if (!isValid()) {
                magRectElm.style.display = 'none';
                return;
            }
            magRectElm.style.display = '';
            magRectElm.style.opacity = rectOpacity;
            magRectElm.style.left = rect.minX + 'px';
            magRectElm.style.top = rect.minY + 'px';
            magRectElm.style.width = (rect.maxX - rect.minX - 2) + 'px';
            magRectElm.style.height = (rect.maxY - rect.minY - 2) + 'px';
        }
    }
    return Magnifier;
});
