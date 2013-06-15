define(function (require){
    var userAgent = require('common/browser/userAgent');
    return /gecko\/\d{7}/i.test(userAgent);
});
