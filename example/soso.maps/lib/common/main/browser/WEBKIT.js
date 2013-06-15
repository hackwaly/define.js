define(function (require){
    var userAgent = require('common/browser/userAgent');
    return /WebKit\//.test(userAgent);
});
