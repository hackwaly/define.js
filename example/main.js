define(function (require){
    require([
        'soso.maps/api'
    ], function (soso_maps){
        var map = new soso_maps.Map(document.body);
        map.bindMapType('GOOGLE', new soso.maps.GoogleMapType());
        map.setMapTypeId('GOOGLE');
        map.setZoomLevel(15);
        map.setCenter(new soso.maps.LatLng(38.89816813905991, -77.02945411205174));
    });
});