define(function (require){
    var create = require('common/vec/mat3/create');
    return function (){
        var mat = create();
        mat[0] = 1;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;
        mat[4] = 1;
        mat[5] = 0;
        mat[6] = 0;
        mat[7] = 0;
        mat[8] = 1;
        return mat;
    };
});
