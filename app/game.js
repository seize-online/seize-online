var common = require('../public/js/common');
var Direction = common.Direction;

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
        }

        var d = Math.floor(Math.random() * Direction.FOUR.length);
        var sideField = field.getSideField(self.getWorld(), Direction.FOUR[d]);

        //TODO: Implement this method
    });
};
