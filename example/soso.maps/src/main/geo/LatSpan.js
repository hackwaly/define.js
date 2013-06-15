define(function (require){
    function LatSpan(sw, ne){
        this.sw = sw;
        this.ne = ne;
    }
    LatSpan.prototype.lngMode = false;
    LatSpan.prototype.isEmpty = function (){
        return this.lngMode ? this.sw === this.ne :
            this.sw >= this.ne;
    };
    LatSpan.prototype._isOver = function (){
        return this.lngMode && this.sw > this.ne;
    };
    LatSpan.prototype.center = function (){
        return this.ne + this.toSpan() / 2;
    };
    LatSpan.prototype.extend = function (v){
        if (this.isEmpty()) {
            this.sw = this.ne = v;
        } else if (this._isOver()) {
            this.sw = Math.max(v, this.sw);
            this.ne = Math.min(v, this.ne);
        } else {
            this.sw = Math.min(v, this.sw);
            this.ne = Math.max(v, this.ne);
        }
    };
    LatSpan.prototype.contains = function (v, strict){
        if (this._isOver()) {
            return strict ? !(this.ne <= v && this.sw >= v) :
                (this.ne < v && this.sw > v);
        } else {
            return strict ? (this.sw < v && this.ne > v) :
                (this.sw <= v && this.ne >= v);
        }
    };
    LatSpan.prototype.toSpan = function (){
        return !this._isOver() ? this.ne - this.sw :
            (360 - (this.sw - this.ne));
    };
    LatSpan.prototype._include2 = function (span){
        return this.ne <= span.sw && this.sw >= span.ne;
    };
    LatSpan.prototype.intersects = function (span){
        var this_is_over = this._isOver();
        if (this_is_over ^ span._isOver()) {
            if (this_is_over) {
                return !this._include2(span);
            } else {
                return !span._include2(this);
            }
        } else {
            return this_is_over ||
                !(this.sw >= span.ne || this.ne <= span.sw);
        }
    };
    LatSpan.prototype.equals = function (span){
        return this.isEmpty() ? span.isEmpty() :
            this.sw === span.sw && this.ne === span.ne;
    };
    LatSpan.prototype.clone = function (){
        return new LatSpan(this.sw, this.ne);
    };
    return LatSpan;
});
