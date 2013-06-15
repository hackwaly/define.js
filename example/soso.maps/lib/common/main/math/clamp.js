define(function (require){
    return function (value, min, max){
        return Math.min(Math.max(value, min), max);
    };
});
