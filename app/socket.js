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

var Field     = common.Field;
var FieldType = common.FieldType;
var Colors    = common.Colors;

module.exports = function(io){
    var fieldCount = 16;

    io.on('connection', function(socket){
        socket.emit('update meta', { 'fieldCount': fieldCount });
    });

    function createRandomField(){
        var x = Math.floor(Math.random() * fieldCount);
        var y = Math.floor(Math.random() * fieldCount);
        var type = (Math.floor(Math.random() * Colors.length) << 4) | FieldType.TERRITORY;

        return new Field(x, y, type, 0);
    }

    function createRandomFields(){
        var fields = [], size = 1 + Math.floor(Math.random() * 3);
        for(var i = 0; i < size; i++) fields.push(createRandomField());
        return fields;
    }

    setInterval(() => io.emit('update field', createRandomFields().map(f => f.toString()).join(';')), 50);
};
