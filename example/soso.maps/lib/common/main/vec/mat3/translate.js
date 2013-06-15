define(function (require){
    var create = require('common/vec/mat3/create');
    return function (x, y){
        var mat = create();
        mat[0] = 1;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;
        mat[4] = 1;
        mat[5] = 0;
        mat[6] = x;
        mat[7] = y;
        mat[8] = 1;
        return mat;
    };
});
