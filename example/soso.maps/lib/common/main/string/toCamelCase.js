define(function (require){
    var re = /-./g;
    var fn = function (m){
        return m.charAt(1).toUpperCase();
    };
    return function (str){
        return str.replace(re, fn);
    };
});
