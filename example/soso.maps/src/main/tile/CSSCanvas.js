define(function (require){
    var setStyle = require('common/css/setStyle');
    var test_CSS_TRANSFORM = require('common/browser/support/test_CSS_TRANSFORM');
    var test_CSS_TRANSFORM_3D = require('common/browser/support/test_CSS_TRANSFORM_3D');

    function CSSCanvas(canvas){
        this.clear = function (){
            canvas.innerHTML = '';
        };
        this.drawImage = function (image, x, y, w, h, alpha){
            if (w === 256 && h === 256) {
                image.style.cssText = ['position:absolute;left:', x.toFixed(0), 'px;top:', y.toFixed(0), 'px;'].join('');
            } else if (test_CSS_TRANSFORM()) {
                image.style.cssText = 'position:absolute;left:0;top:0;';
                setStyle(image, 'transform-origin', '0 0');
                setStyle(image, 'transform', [
                    test_CSS_TRANSFORM_3D() ? 'translate3d(0,0,0)' : '', 'matrix(',
                    ((w + 1) / 256).toFixed(8),
                    ',0,0,',
                    ((h + 1) / 256).toFixed(8),
                    ',',
                    x.toFixed(8),
                    ',',
                    y.toFixed(8),
                    ')'
                ].join(''));
            } else {
                image.style.cssText = [
                    'position:absolute;left:', x.toFixed(0), 'px;top:', y.toFixed(0),
                    'px;width:', Math.floor(w + 1),
                    'px;height:', Math.floor(h + 1), 'px'].join('');
            }
            if (alpha !== 1) {
                image.style.opacity = alpha;
//                setStyle(image, 'opacity', alpha);
            }
            canvas.appendChild(image);
        };
        this.beforeExitFrame = function (){

        };
        this.releaseImage = function (image){

        };
        this.destroy = function (){
            canvas = null;
        };
        this.updateSize = function (){
        };
    }
    return CSSCanvas;
});
