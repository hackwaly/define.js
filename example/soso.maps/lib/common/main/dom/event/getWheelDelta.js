define(function (require){
    return function (evt){
        var wheelDelta = evt.wheelDelta;
        if (typeof wheelDelta !== 'number') {
            wheelDelta = - evt.detail * 40;
        }
        return wheelDelta;
    };
});
