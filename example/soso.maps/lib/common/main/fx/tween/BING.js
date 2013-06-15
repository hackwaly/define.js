define(function (require){
    return function (x) {
        //return c * Math.pow(t / d, 3) + b;
        return 1 - Math.pow(1 - x, 4);
    };
});
