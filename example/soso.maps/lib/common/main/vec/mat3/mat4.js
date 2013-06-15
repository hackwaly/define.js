define(function (require){
    var create = require('common/vec/mat3/create');
    return function (m00, m01, m02, m10, m11, m12, m20, m21, m22){
        var mat = create();
        mat[0] = m00;
        mat[1] = m01;
        mat[2] = m02;
        mat[3] = m10;
        mat[4] = m11;
        mat[5] = m12;
        mat[6] = m20;
        mat[7] = m21;
        mat[8] = m22;
        return mat;
    };
});
