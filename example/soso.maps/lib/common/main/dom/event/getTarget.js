define(function (require){
    return function (evt){
        return evt.target || evt.srcElement;
    };
});
