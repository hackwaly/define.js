define(function (require){
    return function (elm, className){
        return (' ' + elm.className.replace(/\s/g, ' ') + ' ').indexOf(' ' + className + ' ') !== -1;
    };
});
