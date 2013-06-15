define(function (require){
    return function (x) {
        x /= 0.5;
        if (x < 1) {
            return -0.5 * (Math.sqrt(1 - x * x) - 1);
        } else {
            x -= 2;
            return 0.5 * (Math.sqrt(1 - x * x) + 1);
        }
    };
});
