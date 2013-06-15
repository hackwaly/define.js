define(function (require){
    var genSwfHtml = require('common/swf/genHtml');
    var renderMgr = require('common/render/renderMgr');

    var PREFIX = '__777978FF';
    var SN = 0;
    function FlashCanvas(canvasElm){
        var id = PREFIX + (SN ++);
        canvasElm.innerHTML = genSwfHtml({
            "id": id,
            "movie": 'assets/swf/canvas.swf',
            "wmode": 'transparent',
            "allowscriptaccess": 'always',
            "flashvars": ''
        });
        window[id] = {
            "ready": function (){
                console.log(1);
                return true;
            },
            "pushImages": function (){
            }
        };
        var dom = document.getElementById(id);
        dom.style.pointerevents = 'none';
        this.updateSize = function (){
            dom.width = canvasElm.width;
            dom.height = canvasElm.height;
        };
        this.clear = function (){
            pending = [];
            pending.push(6);
            pending.push(0);
            pending.push(0);
            pending.push(canvasElm.width);
            pending.push(canvasElm.height);
        };
        var pending = [];
        var count = 0;
        this.drawImage = function (image, x, y, w, h, alpha){
            pending.push(5);
            pending.push(alpha);

            pending.push(0);
            pending.push(5);
//            pending.push(image.src);
            pending.push('http://p1.map.soso.com/maptilesv2/7/6/4/105_79.png');
            pending.push(x);
            pending.push(y);
            pending.push(w);
            pending.push(h);
            count ++;
        };
        function send(){
            if (pending.length) {
//                console.time('flash');
                try {
                    dom["CallFunction"]('<invoke name="postMessage" returntype="javascript"><arguments><string>' +
                        pending.join('\u7779\u78FF') + '</string></arguments></invoke>');
                } catch (ex){}
//                console.timeEnd('flash');
                pending = [];
            }
//            console.log(count);
            count = 0;
        }
        renderMgr.beforeExitFrame.addCallback(send);
        this.releaseImage = function (){};
        this.destroy = function (){
            canvasElm.innerHTML = '';
            dom = null;
            renderMgr.beforeExitFrame.removeCallback(send);
        };
    }
    return FlashCanvas;
});
