define(function (require){
    return function (node){
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    };
});
