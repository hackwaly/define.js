define(function (require){
    var regex = /:\/\/([^\/]*)/;
    return function (url){
        var m = regex.exec(url);
        return m && m[1];
    };
});
