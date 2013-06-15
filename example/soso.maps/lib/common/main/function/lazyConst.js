define(function (require){
    return function (f){
        var c;
        return function (){
            if (f) {
                c = f();
                f = null;
            }
            return c;
        };
    };
});
