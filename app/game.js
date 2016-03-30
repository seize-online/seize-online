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
var Direction = common.Direction;

var ratio = 5;
function synchronizePower(a, b){
    if(a.hasPower() && b.hasPower()) b.setMeta(sum - a.setMeta(Math.floor(sum / 2)));
};

function Game(world, io){
    this.world = world;
    this.io = io;
}

Game.prototype.getWorld = function(){
    return this.world;
};

Game.prototype.tick = function(buffer){
    var self = this;
    this.getWorld().forEach(function(field){
        if(!field.isTerritory()) return;
        if(field.isEnerge()){
            field.meta += Math.floor((field.isAdvanced() ? 20 : 5) + Math.random() * 10);
            field.hasUpdated = true;
        }

        var d = Math.floor(Math.random() * Direction.FOUR.length);
        var sideField = field.getSideField(Direction.FOUR[d], self.getWorld());

        if(field.getNationId() === sideField.getNationId())
    });
};
