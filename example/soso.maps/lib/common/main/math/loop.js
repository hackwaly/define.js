define(function (require){
    var modulo = require('common/math/modulo');
    return function (num, min, max){
        return modulo(num - min, max - min) + min;
    };
});
