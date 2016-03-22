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
    var size = min($(window).innerWidth(), $(window).innerHeight());
    var fieldSize = 0;

    sketch = Sketch.create({
        fullscreen: false, width: size, height: size,
        autostart: false, autopause: false, autoclear: true
    });

    socket = io();
    world = new World();

    socket.on('update meta', function(data){
        if(data.fieldSize) fieldSize = data.fieldSize;
    });

    socket.on('update field', function(data){
        data.split(';').forEach(function(str){
            world.setField(Field.fromString(str));
        });
    });

    socket.on('hello', function(color){
        sketch.fillStyle = color;
        sketch.fillRect(0, 0, sketch.width, sketch.height);
    });

    sketch.drawField = function(field){
        sketch.fillStyle = 
    };

    sketch.draw = function(){
        world.forEach(function(field, x, y){

        });
    };
});
