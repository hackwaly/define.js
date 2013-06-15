define(function (require){
    return function(matrix, vec, dest) {
        if (!dest) dest = vec;
        var x = vec[0], y = vec[1], z = vec[2];
        dest[0] = x * matrix[0] + y * matrix[3] + z * matrix[6];
        dest[1] = x * matrix[1] + y * matrix[4] + z * matrix[7];
        dest[2] = x * matrix[2] + y * matrix[5] + z * matrix[8];
        return dest;
    };
});
