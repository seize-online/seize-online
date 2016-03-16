
function Game(socket, sketch, world){
    this.socket = socket;
    this.sketch = sketch;
    this.world = world;

    var self = this;
    this.socket.on('update field', function(data){
        data.split(';').forEach(function(str){
            self.world.setField(Field.fromString(str));
        });
    });

    this.socket.on('hello', function(color){
        self.sketch.fillStyle = color;
        self.sketch.fillRect(0, 0, self.sketch.width, self.sketch.height);
    });

    //TODO: Implement other callbacks
}

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

    var game = new Game(socket, sketch, world);
});
