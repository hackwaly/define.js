define(function (require){
    var create = require('common/vec/vec2/create');
    return function (x, y){
        var vec = create();
        vec[0] = x;
        vec[1] = y;
        return vec;
    };
});
