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

var sketch = null;
Sketch.install(this);

var socket = null;
var world = null;

$(function(){
    var options = {
        fieldCount: 0, fieldSize: 0,
        size: min($(window).innerWidth(), $(window).innerHeight()),
        retina: (window.devicePixelRatio || 0) >= 2
    };

    sketch = Sketch.create({
        container: document.getElementById('sketch'),
        fullscreen: false, width: options.size, height: options.size,
        autostart: false, autopause: false, autoclear: true, retina: options.retina
    });

    socket = io();
    world = new World();

    socket.on('update world', function(data){
        console.log('update world', data);

        world = World.fromString(data);
        console.log(world);
    });

    socket.on('update meta', function(data){
        console.log('update meta', data);

        if(data.fieldCount){
            options.fieldCount = data.fieldCount;
            options.fieldSize = floor(options.size / options.fieldCount);
            world.width = world.height = options.fieldCount;

            sketch.start();
        }
    });

    socket.on('update field', function(data){
        console.log('update field', data);

        data.split(';').forEach(function(str){
            world.setField(Field.fromString(str));
        });
    });

    socket.on('hello', function(color){
        sketch.fillStyle = color;
        sketch.fillRect(0, 0, sketch.width, sketch.height);
    });

    function drawField(field){
        var x = field.getX() * options.fieldSize;
        var y = field.getY() * options.fieldSize;

        sketch.fillStyle = Colors[field.getNationId()].color;
        sketch.fillRect(x, y, options.fieldSize, options.fieldSize);

        drawFieldBorders(field);

        sketch.textAlign = 'center';
        sketch.textBaseline = 'middle';
        sketch.font = ceil(options.fieldSize / 4) + "px 'Ubuntu Mono'";
        sketch.fillStyle = Colors[field.getNationId()].text;
        sketch.fillText(field.getMeta().toString(10), x + options.fieldSize / 2, y + options.fieldSize / 2);
    }

    var borders = {};
    borders[Direction.NORTH] = [Direction.NORTHWEST, Direction.NORTHEAST,  0,  1];
    borders[Direction.EAST]  = [Direction.NORTHEAST, Direction.SOUTHEAST, -1,  0];
    borders[Direction.SOUTH] = [Direction.SOUTHEAST, Direction.SOUTHWEST,  0, -1];
    borders[Direction.WEST]  = [Direction.SOUTHWEST, Direction.NORTHWEST,  1,  0];

    function drawFieldBorders(field){
        Direction.FOUR.forEach(direction => {
            var sideField = field.getSideField(direction, world);
            if(sideField === null || field.getNationId() !== sideField.getNationId()) drawFieldBorder(field, direction);
        });
    }

    function getMovedLocation(x, y, direction){
        if(x instanceof Field){
            direction = y;
            y = x.getY();
            x = x.getX();
        }

        var xx = 0.5;
        var yy = 0.5;

        if(direction & Direction.CENTER_HORIZONTAL) xx = 0.5;
        if(direction & Direction.CENTER_VERTICAL) yy = 0.5;

        if(direction & Direction.UP) yy = 0;
        else if(direction & Direction.DOWN) yy = 1;

        if(direction & Direction.LEFT) xx = 0;
        else if(direction & Direction.RIGHT) xx = 1;

        return {
            x: (x + xx) * options.fieldSize,
            y: (y + yy) * options.fieldSize
        };
    }

    function drawFieldBorder(field, direction){
        var a = getMovedLocation(field, borders[direction][0]);
        var b = getMovedLocation(field, borders[direction][1]);

        sketch.lineWidth = ceil(options.fieldSize / 20);
        sketch.strokeStyle = Colors[field.getNationId()].dark;

        var size = sketch.lineWidth / 2;

        sketch.beginPath();
        sketch.moveTo(a.x + borders[direction][2] * size, a.y + borders[direction][3] * size);
        sketch.lineTo(b.x + borders[direction][2] * size, b.y + borders[direction][3] * size);
        sketch.stroke();
    }

    sketch.draw = function(){
        world.forEach(drawField);
    };
});
