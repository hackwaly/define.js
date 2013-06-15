define(function (require){
    var MapChanges = require('soso.maps/map/Changes');
    var addListener = require('common/dom/event/addListener');
    var MOUSE_WHEEL = require('common/dom/event/MOUSE_WHEEL');
    var getWheelDelta = require('common/dom/event/getWheelDelta');
    var stopPropagation = require('common/dom/event/stopPropagation');
    var LINEAR = require('common/fx/tween/LINEAR');
    var Dragger = require('common/dom/Dragger');

    var UNIT_HEIGHT = 8;
    function NavigationControl(map){
        var div = document.createElement('div');
        div.innerHTML = '<div class="smaps_navctrl">' +
            '<div class="smaps_navctrl_zoomin"></div>' +
            '<div class="smaps_navctrl_bar">' +
                '<div class="smaps_navctrl_empty"></div>' +
                '<div class="smaps_navctrl_mercury"></div>' +
                '<div class="smaps_navctrl_bar_body"></div>' +
                '<div class="smaps_navctrl_slot_up"></div>' +
                '<div class="smaps_navctrl_slot_down"></div>' +
                '<div class="smaps_navctrl_buoy"></div>' +
            '</div>' +
            '<div class="smaps_navctrl_zoomout"></div>' +
            '</div>';

        var ctrlDiv = div.firstChild;
        var zoomInDiv = ctrlDiv.firstChild;
        var zoomOutDiv = ctrlDiv.lastChild;
        var barDiv = zoomInDiv.nextSibling;
        var emptyDiv = barDiv.firstChild;
        var mercuryDiv = emptyDiv.nextSibling;
        var bodyDiv = mercuryDiv.nextSibling;
        var buoyDiv = barDiv.lastChild;
        map.getPanes()["control"].appendChild(ctrlDiv);
        var dragger = new Dragger();
        dragger.listen(buoyDiv);
        var clientY;
        var startHeight;
        var dragging = false;
        dragger.onDragStart.addCallback(function (cx, cy){
            clientY = cy;
            startHeight = parseInt(buoyDiv.style.bottom);
            dragging = true;
        });
        dragger.onDragMove.addCallback(function (cx, cy){
            var height = startHeight + clientY - cy;
            var level = map.getMapType().getMinLevel() + height / UNIT_HEIGHT;
            map.setZoomLevel(level);
            level = map.getZoomLevel();
        });
        dragger.onDragEnd.addCallback(function (){
            setTimeout(function (){
                dragging = false;
                var curLevel = map.getZoomLevel();
                var level = Math.round(curLevel);
                map.zoomTo(level, false, null, false, 600, LINEAR);
            }, 200);
        });
        addListener(barDiv, 'click', function (evt){
            var height = barDiv.getBoundingClientRect().bottom - evt.clientY - 9;
            var level = map.getMapType().getMinLevel() + Math.round(height / UNIT_HEIGHT);
            if (!dragging) {
                map.zoomTo(level);
            }
        });
        addListener(zoomInDiv, 'click', function (){
            map.zoomBy(1);
        });
        addListener(zoomOutDiv, 'click', function (){
            map.zoomBy(-1);
        });
        addListener(ctrlDiv, MOUSE_WHEEL, function (evt){
            var delta = getWheelDelta(evt) / 120;
            map.zoomBy(delta);
            stopPropagation(evt);
        });
        function updateMapType(){
            var minLevel = map.getMapType().getMinLevel();
            var maxLevel = map.getMapType().getMaxLevel();
            var height = (maxLevel - minLevel) * UNIT_HEIGHT;
            emptyDiv.style.height = height + 'px';
            bodyDiv.style.height = height + 16 + 'px';
            updateZoomLevel();
        }
        function updateZoomLevel(){
            var zoomLevel = map.getZoomLevel();
            var minLevel = map.getMapType().getMinLevel();
            var height = (zoomLevel - minLevel) * UNIT_HEIGHT;
            mercuryDiv.style.height = height + 4 + 'px';
            buoyDiv.style.bottom = height - 4 + 'px';
        }
        map.addRenderChangesHandler(MapChanges.MAP_TYPE, updateMapType);
        map.addRenderChangesHandler(MapChanges.ZOOM_LEVEL, updateZoomLevel);
    }
    return NavigationControl;
});
