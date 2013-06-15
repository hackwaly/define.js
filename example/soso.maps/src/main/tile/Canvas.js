define(function (require){
    var renderMgr = require('common/render/renderMgr');
    function Canvas(canvas){
        var ctx = canvas.getContext('2d');
//        renderMgr.beforeExitFrame.addCallback(function (){
//            uu.canvas.clearance(ctx);
//        });
        this.clear = function (){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        this.drawImage = function (image, x, y, w, h, alpha){
            ctx.globalAlpha = alpha;
            ctx.drawImage(image, x, y, w + 1, h + 1);
        };
        this.beforeExitFrame = function (){

        };
        this.releaseImage = function (image){

        };
        this.destroy = function (){
            canvas = null;
            ctx = null;
        };
        this.updateSize = function (){
        };
    }
    return Canvas;
});
