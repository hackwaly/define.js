define(function (require){
    function Point(x, y){
        this.x = x;
        this.y = y;
    }
    Point.prototype.clone = function (){
        return new Point(this.x, this.y);
    };
    Point.prototype.equals = function (that){
        return this.x === that.x &&
            this.y === that.y;
    };
    Point.prototype.toString = function (){
        return this.x + ',' + this.y;
    };
    return Point;
});
