define(function (require){
    var uid = 0;
    var magic = '\u7779\u7801';
    return function (obj){
        return obj[magic] || (obj[magic] = '\x01'+ uid++);
    };
});
