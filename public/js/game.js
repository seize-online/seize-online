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
    socket = io('/game');
    world = new World();

    var options = {
        fieldPixels: 0,
        worldPixels: min($(window).innerWidth(), $(window).innerHeight()) - 50,
        isRetina: (window.devicePixelRatio || 0) >= 2
    };

    sketch = Sketch.create({
        container: document.getElementById('sketch'),
        fullscreen: false, width: options.worldPixels, height: options.worldPixels,
        autostart: false, autopause: false, autoclear: true, retina: options.isRetina
    });

    socket.on('update world', function(data){
        console.log('update world', data);

        world = World.fromString(data);
        console.log(world);
    });

    socket.on('update meta', function(data){
        console.log('update meta', data);

        if(data.fieldCount){
            world.width = world.height = options.fieldCount = data.fieldCount;
            options.fieldPixels = floor(options.worldPixels / options.fieldCount);
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
        var x = field.getX() * options.fieldPixels;
        var y = field.getY() * options.fieldPixels;

        sketch.fillStyle = Colors[field.getNationId()].color;
        sketch.fillRect(x, y, options.fieldPixels, options.fieldPixels);

        drawFieldBorders(field);

        sketch.textAlign = 'center';
        sketch.textBaseline = 'middle';
        sketch.font = ceil(options.fieldPixels / 4) + "px 'Ubuntu Mono'";
        sketch.fillStyle = Colors[field.getNationId()].text;
        sketch.fillText(field.getMeta().toString(10), x + options.fieldPixels / 2, y + options.fieldPixels / 2);
    }

    function getMovedLocation(x, y, direction, xxx, yyy){
        if(x instanceof Field){
            direction = y;
            y = x.getY();
            x = x.getX();
        }

        xxx = xxx || 0;
        yyy = yyy || 0;

        var xx = 0.5;
        var yy = 0.5;

        if(direction & Direction.CENTER_HORIZONTAL) xx = 0.5;
        if(direction & Direction.CENTER_VERTICAL) yy = 0.5;

        if(direction & Direction.UP) yy = 0;
        else if(direction & Direction.DOWN){
            yy = 1; yyy = -yyy;
        }

        if(direction & Direction.LEFT) xx = 0;
        else if(direction & Direction.RIGHT){
            xx = 1; xxx = -xxx;
        }

        return {
            x: (x + xx) * options.fieldPixels + xxx,
            y: (y + yy) * options.fieldPixels + yyy
        };
    }

    var borders = {};
    borders[Direction.NORTH] = [Direction.NORTHWEST, Direction.NORTHEAST,  0,  1];
    borders[Direction.EAST]  = [Direction.NORTHEAST, Direction.SOUTHEAST, -1,  0];
    borders[Direction.SOUTH] = [Direction.SOUTHEAST, Direction.SOUTHWEST,  0, -1];
    borders[Direction.WEST]  = [Direction.SOUTHWEST, Direction.NORTHWEST,  1,  0];

    var corners = [
        [Direction.NORTH, Direction.EAST],
        [Direction.EAST, Direction.SOUTH],
        [Direction.SOUTH, Direction.WEST],
        [Direction.WEST, Direction.NORTH]
    ];

    var lineWidthPercent = 15;

    function drawFieldBorders(field){
        var count = 0;
        Direction.FOUR.forEach(direction => {
            var sideField = field.getSideField(direction, world);
            if(sideField === null || field.getNationId() !== sideField.getNationId()) drawFieldBorder(field, direction);
            else count++;
        });

        if(count > 1){
            corners.forEach(corner => {
                var sideFields = [field.getSideField(corner[0], world), field.getSideField(corner[1], world)];
                if(sideFields.some(sideField => sideField === null)) return;
                if(sideFields.every(sideField => sideField.getNationId() === field.getNationId())){
                    drawFieldCorner(field, corner[0] | corner[1]);
                }
            });
        }
    }

    function drawFieldBorder(field, direction){
        var a = getMovedLocation(field, borders[direction][0]);
        var b = getMovedLocation(field, borders[direction][1]);

        sketch.lineWidth = ceil(options.fieldPixels / lineWidthPercent);
        sketch.strokeStyle = Colors[field.getNationId()].dark;
        var size = sketch.lineWidth / 2;

        sketch.beginPath();
        sketch.moveTo(a.x + borders[direction][2] * size, a.y + borders[direction][3] * size);
        sketch.lineTo(b.x + borders[direction][2] * size, b.y + borders[direction][3] * size);
        sketch.stroke();
    }

    function drawFieldCorner(field, direction){
        if(field === null) return;

        sketch.lineWidth = ceil(options.fieldPixels / lineWidthPercent);
        sketch.fillStyle = Colors[field.getNationId()].dark;
        var size = sketch.lineWidth;

        var a = getMovedLocation(field, direction, null, 0, size);
        var b = getMovedLocation(field, direction);
        var c = getMovedLocation(field, direction, null, size, 0);

        sketch.beginPath();
        sketch.moveTo(a.x, a.y);
        sketch.lineTo(b.x, b.y);
        sketch.lineTo(c.x, c.y);
        sketch.lineTo(a.x, a.y);
        sketch.fill();
    }

    sketch.draw = function(){
        world.forEach(drawField);
    };

    function resize(){
        var margins = [
            ($(window).width() - $('#sketch canvas').width()) / 2,
            ($(window).height() - $('#sketch canvas').height()) / 2
        ].map(m => m + 'px');

        $('#sketch canvas').css('margin', [margins[1], margins[0], margins[1], margins[0]].join(' '));
    }

    resize();
    $(window).resize(resize);
});
