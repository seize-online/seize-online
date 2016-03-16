"use strict";

const FieldType = {
    ENERGE:    1,
    TERRITORY: 1 << 1,
    ADVANCED:  1 << 2,
    BARRIER:   1 << 3
};

function Field(x, y, type, meta){
    this.x = x;
    this.y = y;
    this.type = type;
    this.meta = meta;
}

Field.prototype = {
    getX: function(){
        return this.x;
    },

    getY: function(){
        return this.y;
    },

    getType: function(){
        return this.type;
    },

    getMeta: function(){
        return this.meta;
    },

    isEnerge: function(){
        return this.getType() & FieldType.ENERGE;
    },

    isTerritory: function(){
        return this.getType() & FieldType.TERRITORY;
    },

    isAdvanced: function(){
        return this.getType() & FieldType.ADVANCED;
    },

    isBarrier: function(){
        return this.getType() & FieldType.BARRIER;
    },

    toString: function(){
        return [this.getX(), this.getY(), this.getType(), this.getMeta()].map(function(value){ return value.toString(36); }).join(',');
    }
};

Field.fromString = function(string){
    var data = string.split(',').map(function(str){ return parseInt(str, 36); });
    return new Field(data[0], data[1], data[2], data[3]);
};

function World(width, height){
    this.width = width;
    this.height = height;
    this.fields = {};
}

World.prototype = {
    getField: function(x, y){
        if(x instanceof Field){
            y = field.getY();
            x = field.getX();
        }

        return this.fields[x + ':' + y];
    },

    setField: function(x, y, field){
        if(x instanceof Field){
            field = x;
            x = field.getX();
            y = field.getY();
        }

        this.fields[x + ':' + y] = field;
        return field;
    }
};

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

    //TODO: Implement other callbacks
}

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
