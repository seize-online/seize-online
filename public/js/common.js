/*
 * Copyright (C) 2015-2016  ChalkPE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var Direction = {
    UP:    1,
    RIGHT: 1 << 1,
    DOWN:  1 << 2,
    LEFT:  1 << 3,
    CENTER_HORIZONTAL: 1 << 4,
    CENTER_VERTICAL:   1 << 5,
};

Direction.NONE = 0;

Direction.TOP    = Direction.UP;
Direction.CENTER = Direction.CENTER_HORIZONTAL | Direction.CENTER_VERTICAL;
Direction.BOTTOM = Direction.DOWN;

Direction.NORTH = Direction.UP;
Direction.EAST  = Direction.RIGHT;
Direction.SOUTH = Direction.DOWN;
Direction.WEST  = Direction.LEFT;

Direction.NORTHEAST = Direction.NORTH | Direction.EAST;
Direction.SOUTHEAST = Direction.SOUTH | Direction.EAST;
Direction.SOUTHWEST = Direction.SOUTH | Direction.WEST;
Direction.NORTHWEST = Direction.NORTH | Direction.WEST;

Direction.FOUR  = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
Direction.EIGHT = [Direction.NORTH, Direction.NORTHEAST, Direction.EAST, Direction.SOUTHEAST, Direction.SOUTH, Direction.SOUTHWEST, Direction.WEST, Direction.NORTHWEST];

Object.freeze(Direction);

var FieldType = {
    ENERGE:    1,
    TERRITORY: 1 << 1,
    ADVANCED:  1 << 2,
    BARRIER:   1 << 3
};

Object.freeze(FieldType);

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

    getSideField: function(world, direction){
        var xx = 0;
        var yy = 0;

        if(direction & Direction.CENTER_HORIZONTAL) xx = 0;
        if(direction & Direction.CENTER_VERTICAL) yy = 0;

        if(direction & Direction.UP) yy = -1;
        else if(direction & Direction.DOWN) yy = 1;

        if(direction & Direction.LEFT) xx = -1;
        else if(direction & Direction.RIGHT) xx = 1;

        return world.getField(this.getX() + xx, this.getY() + yy);
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
    'Direction': Direction,
    'FieldType': FieldType,
    'Field': Field,
    'World': World
};
