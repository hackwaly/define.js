define(function (require){
    var hop = require('common/object/hop');
    var delegate = require('common/util/delegate');

    function LinkedMap(maxCount, asCache){
        this._maxCount = maxCount | 0;
        this._asCache = !!asCache;
        this.onDrop = delegate();
        this.clear();
    }

    LinkedMap.prototype.count = 0;
    LinkedMap.prototype.isEmpty = function (){
        return !this.count;
    };
    LinkedMap.prototype.isFull = function (){
        return this.count >= this._maxCount;
    };
    LinkedMap.prototype.setMaxCount = function (count){
        this._maxCount = count | 0;
        if (this._maxCount) {
            this._truncate(this._maxCount);
        }
    };
    LinkedMap.prototype.get = function (key, unsetVal){
        var node = this._findAndMoveToTop(key);
        return node ? node.value : unsetVal;
    };
    LinkedMap.prototype.set = function (key, value){
        var node = this._findAndMoveToTop(key);
        if (node) {
            node.value = value;
        } else {
            node = new Node(key, value);
            this._map[key] = node;
            this._insert(node);
            this.count ++;
        }
    };
    LinkedMap.prototype.remove = function (key){
        if (hop(this._map, key)) {
            this._removeNode(this._map[key]);
            return true;
        }
        return false;
    };
    LinkedMap.prototype.forEach = function (fn, this_){
        for (var n = this._head.next; n != this._head; n = n.next) {
            fn.call(this_, n.value, n.key, this);
        }
    };
    LinkedMap.prototype.peekValue = function (key, value){
        return hop(this._map, key) ? this._map[key].value : value;
    };
    LinkedMap.prototype.peek = function (){
        return this._head.next.value;
    };
    LinkedMap.prototype.peekLast = function (){
        return this._head.prev.value;
    };
    LinkedMap.prototype.shift = function (){
        return this._popNode(this._head.next);
    };
    LinkedMap.prototype.pop = function (){
        return this._popNode(this._head.prev);
    };
    LinkedMap.prototype._findAndMoveToTop = function (key){
        if (hop(this._map, key)) {
            var node = this._map[key];
            if (this._asCache) {
                node.remove();
                this._insert(node);
            }
            return node;
        }
    };
    LinkedMap.prototype._insert = function (node){
        if (this._asCache) {
            node.next = this._head.next;
            node.prev = this._head;

            this._head.next = node;
            node.next.prev = node;
        } else {
            node.prev = this._head.prev;
            node.next = this._head;

            this._head.prev = node;
            node.prev.next = node;
        }

        if (this._maxCount) {
            this._truncate(this._maxCount);
        }
    };
    LinkedMap.prototype._truncate = function (count){
        for (var i = this.count; i > count; i--) {
            var node = this._asCache ? this._head.prev : this._head.next;
            this._removeNode(node);
            this.onDrop(node.value);
        }
    };
    LinkedMap.prototype._removeNode = function (node){
        node.remove();
        delete this._map[node.key];
        this.count --;
    };
    LinkedMap.prototype._popNode = function (node){
        if (this._head !== node) {
            this._removeNode(node);
        }
        return node.value;
    };
    LinkedMap.prototype.clear = function (){
        this._map = {};
        this._head = new Node('', null);
        this._head.prev = this._head.next = this._head;
        this.count = 0;
    };

    function Node(key, value){
        this.key = key;
        this.value = value;
    }
    Node.prototype.prev = null;
    Node.prototype.next = null;
    Node.prototype.remove = function (){
        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.prev = null;
        this.next = null;
    };

    return LinkedMap;
});
