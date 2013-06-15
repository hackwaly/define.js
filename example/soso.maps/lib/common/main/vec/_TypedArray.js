define(function (require){
    return typeof Float32Array !== 'undefined' ?
        Float32Array : Array;
});
