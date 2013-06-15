define(function (require){
    return function (dom, type, listener){
        if (dom.removeEventListener) {
            dom.removeEventListener(type, listener, false);
        } else {
            dom.detachEvent('on' + type, listener);
        }
    };
});
