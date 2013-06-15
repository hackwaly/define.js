var soso = window.soso || {};
soso.maps = soso.maps || {};
define(function (require){
    soso.maps.Point = require('soso.maps/geo/LatLng');
    soso.maps.Bounds = require('soso.maps/geo/LatLng');
    soso.maps.LatLng = require('soso.maps/geo/LatLng');
    soso.maps.LatLngBounds = require('soso.maps/geo/LatLngBounds');
    soso.maps.Map = require('soso.maps/map/Map');
    soso.maps.SosoMapType = require('soso.maps/type/SosoMapType');
    soso.maps.GoogleMapType = require('soso.maps/type/GoogleMapType');
    soso.maps.TestMapType = require('soso.maps/type/TestMapType');
    soso.maps.MapBoxMapType = require('soso.maps/type/MapBoxMapType');
    soso.maps.NearMapMapType = require('soso.maps/type/NearMapMapType');
    soso.maps.NavigationControl = require('soso.maps/control/NavigationControl');
    soso.maps.$renderMgr = require('common/render/renderMgr');
    soso.maps.$timeline = require('common/fx/timeline');
});
