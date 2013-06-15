define(function (require){
    var create = require('common/vec/mat3/create');
    return function (x, y, z){
        var mat = create();
        mat[0] = x;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;
        mat[4] = y;
        mat[5] = 0;
        mat[6] = 0;
        mat[7] = 0;
        mat[8] = z;
        return mat;
    };
});
