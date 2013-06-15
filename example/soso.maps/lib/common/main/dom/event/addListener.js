define(function (require){
    return function (dom, type, listener){
        if (dom.addEventListener) {
            dom.addEventListener(type, listener, false);
        } else {
            dom.attachEvent('on' + type, listener);
        }
    };
});
