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

var socket;
$(function(){
    socket = io('/room');
    socket.on('room list', function(array){
        console.log("room list"); console.log(array);

        $('#rooms').empty();
        array.forEach(name => $('<div>').addClass('chip room').text(name).appendTo('#rooms'));
    });

    $("#createRoomButton").click(function(){
        var name = Array.apply(null, Array(Math.floor(4 + Math.random() * 16))).map(i => String.fromCharCode(97 + Math.random() * 26)).join('');
        console.log(name);

        socket.emit('room create', name);
    });
});
