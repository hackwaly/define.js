define(function (require){
    return function (v1, v2){
        v1 = v1.split('.');
        v2 = v2.split('.');
        var l = Math.max(v1.length, v2.length);
        for (var i=0; i<l; i++) {
            var p1 = v1[i];
            var p2 = v2[i];
            if (!p1 || !p2) {
                return !p1 && !p2 ? 0 : p1 ? 1 : -1;
            }
            p1 = Number(p1);
            p2 = Number(p2);
            if (p1 < p2) {
                return -1;
            } else if (p1 > p2) {
                return 1;
            }
        }
        return 0;
    };
});
