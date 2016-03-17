var sketch = null;
Sketch.install(this);

$(function(){
    var size = min($(window).innerWidth(), $(window).innerHeight());

    sketch = Sketch.create({
        fullscreen: false,
        width: size, height: size,
        autostart: false, autopause: false,

        setup: function(){
            //TODO: Implement this method
        }
    });

    var socket = io();
    var world = new World();

    socket.on('update field', function(data){
        data.split(';').forEach(function(str){
            world.setField(Field.fromString(str));
        });
    });

    socket.on('hello', function(color){
        sketch.fillStyle = color;
        sketch.fillRect(0, 0, sketch.width, sketch.height);
    });
});
