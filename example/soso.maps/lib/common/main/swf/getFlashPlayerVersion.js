define(function (require){
    var IE = require('common/browser/IE');

    var ver;
    return function (){
        if (ver == null) {
            var n = navigator;
            if (n.plugins && n.mimeTypes.length) {
                var plugin = n.plugins["Shockwave Flash"];
                if (plugin && plugin.description) {
                    ver = plugin.description
                        .replace(/([a-zA-Z]|\s)+/, "")
                        .replace(/(\s)+r/, ".") + ".0";
                }
            } else if (IE) {
                try {
                    var c = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                    if (c) {
                        var v = c.GetVariable("$version");
                        ver = v.replace(/WIN/g, '').replace(/,/g, '.');
                    }
                } catch (e) { }
            }
        }
        return ver;
    };
});
