define(function (require){
    var s = 5;
    return function (x){
        return (1.0 - Math.exp(-x * s)) / (1.0 - Math.exp(-s));
    };
});
