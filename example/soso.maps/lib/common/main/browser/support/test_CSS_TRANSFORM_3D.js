define(function (require){
    var bind = require('common/function/bind');
    var supportStyle = require('common/css/supportStyle');
    return bind(supportStyle, null, ['transform-3d']);
});
