define.js
=========
yet another `amd` loader that support `sync' mode specially.

# Build & Optimze

the difference from other `amd` loader, such as "requirejs" and so on:

* not just concat modules. the result you won't see `define` and `require`, include the define closure of almost all module. the result code will in a big closure.
* you can build a standalone main module script by giving the main module id.
* you can build a main module script with several lazy load modules as your config. the build-chain will analyze the "async require" (`require([],callback)`) and implicit dependencies(who are in main module, who are in other lazy module, and who are in the up closure). then process it smartly. the lazy module use `eval` to load in the up module's closure. just like "google maps" do.

# How To Use

* use `data-base` attribute to set baseUrl. if's bootstrap path by default.
* use `data-sync` attribute to set sync mode. it's `"false"` by default.
* use `data-main` attribute to set main module id. it's required.

in `sync` mode, you can do this.
```html
<script src="define.js" data-main="my_library/your_api" data-sync="true"></script>
<script>
    // you api is ready for use.
    my_api.alert('hello define.js');
</script>
```
your api
```javascript
var my_api;
define(function (require){
    var alert = require('my_library/your_alert');
    my_api = {};
    my_api.alert = alert;
});
```
your alert
```javascript
define(function (require, exports){
    exports.alert = function (msg){
        alert(msg);
    };
});
```
so, you can simply replace the script tag to switch release version and dev version.

you did't need write `require([], function (){ ... })` in your html page.

