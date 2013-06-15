define(function (require){
    var hop = Object.prototype.hasOwnProperty;
    return function (obj, key){
        return hop.call(obj, key);
    };
});
