define(function (require){
    var Changes = {};
    var flag = 1;
    var i = 0;
    Changes.SIZE = flag << i ++;
    Changes.CENTER = flag << i ++;
    Changes.ZOOM_LEVEL = flag << i ++;
    Changes.MAP_TYPE = flag << i ++;
    Changes.PROJECTION = flag << i ++;
    Changes.ORIGIN = flag << i ++;
    Changes.BOUNDS =
        Changes.SIZE |
        Changes.CENTER |
        Changes.ZOOM_LEVEL;
    return Changes;
});
