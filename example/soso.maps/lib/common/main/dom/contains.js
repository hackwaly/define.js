define(function (require){
    return function (a, b){
        if (a.compareDocumentPosition) {
            return !!(a.compareDocumentPosition(b) & 20);
        }
        var p = b.parentNode;
        while (p) {
            if (p === a) {
                return true;
            }
        }
        return false;
    };
});
