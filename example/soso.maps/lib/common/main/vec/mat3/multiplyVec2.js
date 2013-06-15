define(function (require){
    return function(matrix, vec, dest) {
        if (!dest) dest = vec;
        var x = vec[0], y = vec[1];
        dest[0] = x * matrix[0] + y * matrix[3] + matrix[6];
        dest[1] = x * matrix[1] + y * matrix[4] + matrix[7];
        return dest;
    };
});
