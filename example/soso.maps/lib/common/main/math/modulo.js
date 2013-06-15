define(function (require){
    return function (a, b){
        var r = a % b;
        return r * b < 0 ? r + b : r;
    };
});
