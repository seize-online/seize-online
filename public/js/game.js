"use strict";

var sketch = null;
Sketch.install(this);

$(function(){
    var size = min($(window).innerWidth(), $(window).innerHeight());
    sketch = Sketch.create({
        fullscreen: false,
        width: size, height: size,
        autostart: true, autopause: false,

        setup: function(){
            //TODO: Implement this method
        }
    });
});
