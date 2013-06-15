var define = define || function (){
    //region { util }
    var win = window;
    var doc = document;

    var IE = !!win.ActiveXObject;
    var W3C = !!win.addEventListener;

    function assert(expr, msg){
        if (!expr) throw msg;
    }
    function log(msg){
        if (win.console) console.log(msg);
    }
    function now(){
        return +new Date();
    }
    var Object$hop = Object.prototype.hasOwnProperty;
    function hop(obj, key){
        return Object$hop.call(obj, key);
    }
    function bind(fn, this_, args){
        return function (){
            return fn.apply(this_ || this, args || arguments);
        };
    }
    function map(array, fn, this_){
        var ret = [];
        for (var i=0; i<array.length; i++) {
            ret[i] = fn.call(this_, array[i], i, array);
        }
        return ret;
    }
    function lastItem(array){
        return array[array.length - 1];
    }
    function lastFind(array, test){
        for (var j=array.length; j--;) {
            var item = array[j];
            if (test(item)) return item;
        }
    }
    function allScripts(){
        return doc.getElementsByTagName('script');
    }
    function lastScript(){
        return lastItem(allScripts());
    }
    //endregion

    //region { misc }
    function _isBootstrapScript(script){
        return script.getAttribute('src').indexOf('define.js') >= 0;
    }
    function extractDirPath(path){
        var k = path.lastIndexOf('/');
        return k === -1 ? '' : path.slice(0, k + 1);
    }
    function fixDirPath(path){
        return path.charAt(path.length - 1) !== '/' ?
            path + '/' : path;
    }
    var _scriptJustAppended;
    var _withScriptCallbacks = [];
    function _onNonIEScriptLoad(evt){
        var callbacks = _withScriptCallbacks;
        _withScriptCallbacks = [];
        for (var i=0; i<callbacks.length; i++) {
            callbacks[i](evt.target);
        }
    }
    function appendScript(script){
        _scriptJustAppended = script;
        if (!IE) script.addEventListener('load', _onNonIEScriptLoad, false);
        var place = doc.body ||
            doc.getElementsByTagName('head')[0] ||
            doc.documentElement;
        place.appendChild(script);
        _scriptJustAppended = null;
    }
    function removeScript(script){
        if (!IE) script.removeEventListener('load', _onNonIEScriptLoad, false);
        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
    }
    function _isNonIEDomNotReady(){
        var rs = doc.readyState;
        return rs === 'uninitialized' || rs === 'loading';
    }
    function _isInteractiveScript(script){
        return script.readyState === 'interactive';
    }
    function _findInteractiveScript(){
        if (!IE) return lastScript();
        return lastFind(allScripts(), _isInteractiveScript);
    }
    function withInteractiveScript(callback){
        if (IE || _isNonIEDomNotReady()) {
            callback(_scriptJustAppended || _findInteractiveScript());
        } else {
            _withScriptCallbacks.push(callback);
        }
    }
    function grabScriptLibrarys(script){
        var librarys = {};
        function library(prefix, path){
            librarys[prefix] = path;
        }
        define['library'] = library;
        new Function(script.text)();
        delete define['library'];
        return librarys;
    }

    var _reComment = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
    function stripComments(code){
        return code.replace(_reComment, '');
    }

    var _reDep = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
    function parseDeps(def){
        var code = stripComments(def + '');
        var ret = [];
        for (var match; match = _reDep.exec(code);) {
            ret.push(match[1]);
        }
        return ret;
    }

    // inspired from `amdefine`.
    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i+= 1) {
            part = ary[i];
            if (part === '.') {
                ary.splice(i, 1);
                i -= 1;
            } else if (part === '..') {
                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    //End of the line. Keep at least one non-dot
                    //path segment at the front so it can be mapped
                    //correctly to disk. Otherwise, there is likely
                    //no path mapping for a path starting with '..'.
                    //This can still fail, but catches the most reasonable
                    //uses of ..
                    break;
                } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                }
            }
        }
    }

    function normalize(name, baseName) {
        var baseParts;

        //Adjust any relative paths.
        if (name && name.charAt(0) === '.') {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                baseParts = baseName.split('/');
                baseParts = baseParts.slice(0, baseParts.length - 1);
                baseParts = baseParts.concat(name.split('/'));
                trimDots(baseParts);
                name = baseParts.join('/');
            }
        }

        return name;
    }
    //endregion

    //region { Module }
    function Module(context, id){
        this['id'] = id;
        this['uri'] = context.resolve_(id);
        this['exports'] = {};
        this['dependencies'] = [];
        this.context_ = context;
        this.state_ = Module.ST_INITIAL_;
        this._def = null;
        this._readyCallbacks = [];
    }

    Module.ST_INITIAL_ = 0;
    Module.ST_LOADING_ = 1;
    Module.ST_LOADED_ = 2;
    Module.ST_READY_ = 3;
    Module.ST_COMPLETE_ = 4;

    Module.prototype.gotDef_ = function (def){
        assert(this.state_ < Module.ST_LOADED_);
        this.state_ = Module.ST_LOADED_;
        this._def = def;
        var deps = map(parseDeps(def), this.normalize_, this);
        this['dependencies'] = deps;

        if (this._readyCallbacks.length) {
            this.context_._forReady(deps,
                bind(this._onDepsReady, this));
        }
    };
    Module.prototype._onDepsReady = function (){
        this.state_ = Module.ST_READY_;
        var callbacks = this._readyCallbacks;
        for (var i=0; i<callbacks.length; i++) {
            callbacks[i](this);
        }
        this._readyCallbacks = null;
    };
    Module.prototype.require_ = function (p1, p2){
        if (typeof p1 === 'string') {
            var module = this.context_.get_(this.normalize_(p1));
            assert(module && module.state_ >= Module.ST_READY_);
            return module.getExports_();
        }
        var asyncCtx = new Context(this.context_.sandbox_, false);
        asyncCtx.require_(map(p1, this.normalize_, this), p2);
    };
    Module.prototype.getExports_ = function (){
        if (this.state_ === Module.ST_READY_) {
            var result = (this._def)(
                bind(this.require_, this),
                this['exports'],
                this);
            if (result !== undefined) {
                this['exports'] = result;
            }
            this.state_ = Module.ST_COMPLETE_;
        }
        assert(this.state_ === Module.ST_COMPLETE_);
        return this['exports'];
    };
    Module.prototype.normalize_ = function (modId){
        return normalize(modId, this['id']);
    };
    Module.prototype.ready_ = function (callback){
        if (this.state_ >= Module.ST_READY_) {
            callback(this);
        } else {
            this._readyCallbacks.push(callback);
        }
        if (this.state_ < Module.ST_LOADING_) {
            this.state_ = Module.ST_LOADING_;
            this.context_.load_(this);
        }
    };
    //endregion

    //region { Sandbox }
    function Sandbox(baseUrl, librarys){
        this.baseUrl_ = baseUrl;
        this.librarys_ = {};
        this._mods = {};
        var buff = [];
        for (var prefix in librarys) {
            if (hop(librarys, prefix)) {
                buff.push(prefix + "\\/");
                this.librarys_[prefix] = fixDirPath(librarys[prefix]);
            }
        }
        buff.sort(function (a, b){
            return a.length - b.length;
        });
        this._librarysRegex = !buff.length ? null :
            new RegExp("^(?:" + buff.join("|") + ")");
    }
    Sandbox.prototype.get_ = function (id, context){
        if (!hop(this._mods, id)) {
            this._mods[id] = new Module(context, id);
        }
        return this._mods[id];
    };
    Sandbox.prototype.resolve_ = function (modId){
        if (this._librarysRegex) {
            var match = this._librarysRegex.exec(modId);
            if (match) {
                match = match[0];
                modId = this.librarys_[match.slice(0, -1)] +
                    modId.slice(match.length);
            }
        }
        return this.baseUrl_ + modId + '.js';
    };
    //endregion

    //region { Context }
    function Context(sandbox, sync){
        this._id = 'defctx' + (Context._counter++);
        Context._contexts[this._id] = this;
        this.sandbox_ = sandbox;
        this.sync_ = sync;
        this._lock = 0;
        this._toLoadMods = [];
    }
    Context._counter = 0;
    Context._contexts = {};
    Context.get_ = function (id){
        return hop(this._contexts, id) ?
            this._contexts[id] : null;
    };
    Context.prototype.get_ = function (modId){
        return this.sandbox_.get_(modId, this);
    };
    Context.prototype.resolve_ = function (modId){
        return this.sandbox_.resolve_(modId);
    };
    Context.prototype._forReady = function (modIds, callback){
        if (modIds.length <= 0) {
            callback();
        } else {
            var this_ = this;
            this.lock_(function (){
                var notReadyCount = modIds.length;
                function onModReady(){
                    if (-- notReadyCount === 0) callback();
                }
                for (var i=0; i<modIds.length; i++) {
                    var module = this.get_(modIds[i]);
                    module.ready_(onModReady);
                }
            }, this);
        }
    };
    Context.prototype.require_ = function (modIds, callback){
        var this_ = this;
        this._forReady(modIds, function (){
            var array = [];
            for (var i=0; i<modIds.length; i++) {
                array[i] = this_.get_(modIds[i]).getExports_();
            }
            callback.apply(null, array);
        });
    };
    Context.prototype.lock_ = function (callback, this_){
        this._lock ++;
        callback.call(this_);
        if (-- this._lock === 0) {
            var mods = this._toLoadMods;
            this._toLoadMods = [];
            this._doLoad(mods);
        }
    };
    Context.prototype._doLoad = function (mods){
        if (this.sync_) {
            this._doLoadSync(mods);
        } else {
            this._doLoadAsync(mods);
        }
    };
    Context.prototype._doLoadSync = function (mods){
        var buff = [];
        for (var i=0; i<mods.length; i++) {
            var mod = mods[i];
            buff.push('<script type="text/javascript" src="');
            buff.push(mod['uri']);
            buff.push('" data-defctxid="');
            buff.push(this._id);
            buff.push('" data-defmodid="');
            buff.push(mod['id']);
            buff.push('">');
            buff.push('</script>');
        }
        doc.write(buff.join(''));
    };
    Context.prototype._doLoadAsync = function (mods){
        for (var i=0; i<mods.length; i++) {
            var mod = mods[i];
            var script = doc.createElement('script');
            script.setAttribute('src', mod['uri']);
            script.setAttribute('data-defctxid', this._id);
            script.setAttribute('data-defmodid', mod['id']);
            appendScript(script);
        }
    };
    Context.prototype.load_ = function (mod){
        if (this._lock) {
            this._toLoadMods.push(mod);
        } else {
            this._doLoad([mod]);
        }
    };
    //endregion { Context }

    function bootstrap(){
        var script = lastFind(allScripts(), _isBootstrapScript);
        var baseUrl = script.getAttribute('data-base') ||
            extractDirPath(script.getAttribute('src'));
        var sandbox = new Sandbox(
            fixDirPath(baseUrl),
            grabScriptLibrarys(script));
        var context = new Context(sandbox,
            script.getAttribute('data-sync') === 'true');
        var mainId = script.getAttribute('data-main');
        var time = now();
        context.require_([mainId], function (){
            log('bootstrap finish (' + (now() - time) + 'ms)');
        });
    }

    function define(def){
        withInteractiveScript(function (script){
            assert(!!script);
            var ctxId = script.getAttribute('data-defctxid');
            var modId = script.getAttribute('data-defmodid');
            var ctx = Context.get_(ctxId);
            var mod = ctx.get_(modId);
            mod.gotDef_(def);
            removeScript(script);
        });
    }

    define._bootstrap = bootstrap;

    return define;
}();
define._bootstrap();