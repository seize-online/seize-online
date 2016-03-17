"use strict";

var FieldType = {
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
    getWidth: function(){
        return this.width;
    },

    getHeight: function(){
        return this.height;
    },

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
    },

    forEach: function(callback, options){
        options = options || {};
            entire: false,
            range: [[0, 0], [this.getWorld().getWidth(), this.getWorld().getHeight()]
        };

        for(var x = options.range[0][0]; x < options.range[1][0]; x++) for(var y = options.range[0][1]; y < options.range[1][1]; y++){
            var field = this.getField(x, y);
            if(!field && !options.entire) continue;
            if(callback(field)) return;
        }
    }
};

if(module) module.exports = {
    'FieldType': FieldType,
    'Field': Field,
    'World': World
};
