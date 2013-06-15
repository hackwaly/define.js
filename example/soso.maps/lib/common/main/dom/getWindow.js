define(function (require){
    var getDocument = require('common/dom/getDocument');
    return function (dom){
        var doc = getDocument(dom);
        return doc.defaultView || doc.parentWindow;
    };
});
