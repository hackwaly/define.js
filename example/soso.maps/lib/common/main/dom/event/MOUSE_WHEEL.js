define(function (require){
    var GECKO = require('common/browser/GECKO');
    return GECKO ? 'DOMMouseScroll' : 'mousewheel';
});
