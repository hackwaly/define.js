define(function (require){
    return function (x){
        return x <= 0.5 ?
            Math.pow(x * 2, 2) * .5 :
            Math.pow((1 - x) * 2, 2) * -0.5 + 1;
    };
});
