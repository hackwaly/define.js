define.js
=========
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