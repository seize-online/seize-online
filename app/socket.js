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

var common = require('../public/js/common');

var World     = common.World;
var Field     = common.Field;
var FieldType = common.FieldType;
var Colors    = common.Colors;

var Room = require('./room');
var rooms = [];

module.exports = function(app, io){
    var room = io.of('room');

    room.on('connection', function(socket){
        function emitRoomList(target){
            target = target || room;
            console.log(rooms);

            var firstRooms = rooms.slice(0, Math.min(30, rooms.length)).map(r => r.name);
            target.emit('room list', firstRooms);
        }
        emitRoomList(socket);

        socket.on('room create', function(name){
            console.log(name);
            
            rooms.push(new Room(name));
            emitRoomList();
        });
    });

    var fieldCount = 10 + Math.floor(Math.random() * 11);
    var world = new World(fieldCount, fieldCount);

    var game = io.of('game');
    game.on('connection', function(socket){
        socket.emit('update meta', { 'fieldCount': fieldCount });
        socket.emit('update world', world.toString());
    });

    function createRandomField(){
        var x = Math.floor(Math.random() * fieldCount);
        var y = Math.floor(Math.random() * fieldCount);
        var type = (Math.floor(Math.random() * Colors.length) << 4) | FieldType.TERRITORY;
        var meta = Math.floor(Math.random() * 1000);

        return new Field(x, y, type, meta);
    }

    function createRandomFields(){
        var fields = [], size = 1 + Math.floor(Math.random() * 3);
        for(var i = 0; i < size; i++) fields.push(createRandomField());
        return fields;
    }

    setInterval(() => game.emit('update field', createRandomFields().map(f => world.setField(f)).map(f => f.toString()).join(';')), 200);
};
