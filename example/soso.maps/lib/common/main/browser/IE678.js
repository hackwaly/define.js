define(function (require){
    var IE = require('common/browser/IE');
    var W3C_EVENT = require('common/browser/support/W3C_EVENT');
    return IE && !W3C_EVENT;
});
