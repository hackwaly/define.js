define(function (require){
    return function (fn, this_, args){
        return function (){
            return fn.apply(this_ || this, args || arguments);
        };
    };
});
