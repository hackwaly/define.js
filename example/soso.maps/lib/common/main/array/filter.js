define(function (require){
    var demethodize = require('common/function/demethodize');
    var _Array$filter = Array.prototype.filter;
    return _Array$filter ? demethodize(_Array$filter) :
        function (array, fn, thisp){
            var ret = [];
            for (var k = array.length; k--;) {
                var v = array[k];
                if (fn.call(thisp, v)) {
                    ret.push(v);
                }
            }
            return ret;
        };
});
