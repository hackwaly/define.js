define(function (require){
    var IE = require('common/browser/IE');
    var WEBKIT = require('common/browser/WEBKIT');
    var GECKO = require('common/browser/GECKO');
    var OPERA = require('common/browser/OPERA');
    var toCamelCase = require('common/string/toCamelCase');
    var toCapitalCase = require('common/string/toCapitalCase');
    var PREFIX = IE ? 'ms' :
        WEBKIT ? 'Webkit' :
        GECKO ? 'Moz' :
        OPERA ? 'O' : '';

    var mem = {};
    mem["float"] = IE ?
        'styleFloat' : 'cssFloat';

    function domKey(key){
        key = toCamelCase(key);
        var style = document.documentElement.style;
        var prefixedKey = PREFIX + toCapitalCase(key);
        return (key in style) ? key :
            (prefixedKey in style) ? prefixedKey : null;
    }
    return function (key){
        return mem[key] || (mem[key] = domKey(key));
    };
});
