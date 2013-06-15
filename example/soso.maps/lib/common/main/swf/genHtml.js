define(function (require){
    var IE = require('common/browser/IE');
    var compareVersion = require('common/about/compareVersion');
    var getFlashPlayerVersion = require('common/swf/getFlashPlayerVersion');

    var objDefAttrs = IE ? ' classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"' +
        ' codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"' :
        ' type="application/x-shockwave-flash"';
    var objAttrKeys = ['id', 'width', 'height', 'align', 'data'];
    var objParamKeys = ['wmode', 'movie', 'flashvars', 'scale', 'quality', 'play', 'loop', 'menu', 'salign', 'bgcolor', 'base',
        'allowscriptaccess', 'allownetworking', 'allowfullscreen', 'seamlesstabbing', 'devicefont', 'swliveconnect'];

    return function (options){
        var i, key;
        var minVer = options['minVer'];
        var maxVer = options['maxVer'];
        if (minVer || maxVer) {
            var localVer = getFlashPlayerVersion();
            if (!localVer ||
                (minVer && compareVersion(localVer, minVer) < 0) ||
                (maxVer && compareVersion(localVer, maxVer) > 0)) {
                return options['altHtml'] || '';
            }
        }
        var buff = ['<object', objDefAttrs];
        options['data'] = options['movie'];
        for (i=0; i<objAttrKeys.length; i++) {
            key = objAttrKeys[i];
            if (options.hasOwnProperty(key)) {
                buff.push(' ', key, '="', options[key], '"');
            }
        }
        buff.push('>');
        for (i=0; i<objParamKeys.length; i++) {
            key = objParamKeys[i];
            if (options.hasOwnProperty(key)) {
                buff.push('<param name="', key, '" value="', options[key], '"/>');
            }
        }
        buff.push('</object>');
        return buff.join('');
    };
});
