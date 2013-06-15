define(function (require){
    return function (dom){
        return dom.nodeType === 9 ? dom : dom.ownerDocument;
    };
});
