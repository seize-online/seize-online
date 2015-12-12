/*
 * Copyright (C) 2015  ChalkPE
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

/* ================================================================================================================================ */

function isEqualNumber(n, m){
    return abs(n - m) < (function(){
        if("EPSILON" in Number) return Number.EPSILON;
        var epsilon = 1.0; do { epsilon /= 2.0; } while(1.0 + (epsilon / 2.0) != 1.0); return epsilon;
    }());
}

function shuffleArray(array){
    return array.map(function(element){
        return [Math.random(), element];
    }).sort().map(function(element){
        return element[1];
    });
}

function rgba(rgb, a){
    a = a || "1.0";
    var hex = parseInt(rgb.replace("#" , ""), 16);

    var r = (hex >> 16) & 255;
    var g = (hex >>  8) & 255;
    var b =  hex        & 255;

    return "rgba(" + [r, g, b, a].join(",") + ")";
}

/* ================================================================================================================================ */

Sketch.install(this);
var sketch = null;

var Main = {
    isHost: false,
    showPowerText: false,
    backgroundColor: "#222222",

    startGame: function(){
        if(sketch !== null) sketch.destroy();
        sketch = Sketch.create({
            container: $("#sketch")[0], globals: false,
            fullscreen: false, autostart: false, autopause: false, interval: 5,
            width: window.innerWidth, height: window.innerHeight - (Main.onMainMenu ? 0 : $("#toolbar").outerHeight())
        });
        $("#sketch").css("bottom", Main.onMainMenu ? "0px" : "")

        Map.init();

        var colors = shuffleArray(Nation.STANDARD);
        colors.forEach(function(standard){
            Map.setNation(standard.color, new Nation(standard.index, standard.color, standard.dark, standard.name));
        });

        if(Map.getPlayerNation() !== null) Map.getPlayerNation().name = "You";
        console.debug(Map.nations);

        colors.splice(floor(colors.length / 2), 0, null);
        colors.forEach(function(standard, index){
            if(standard === null) return;
            var nation = Map.getNation(standard.color);

            var x = 1 + floor((Map.width - 3) / 2) * floor(index / 3);
            var y = 1 + floor((Map.height - 3) / 2) * floor(index % 3);

            var field = new EnergeField(x, y, 100, nation, 1);
            Map.setField(x, y, field);

            field.forEachSides(function(sideField, direction){
                if(sideField === null || !(sideField instanceof Field)) return;

                sideField = new Field(sideField.getX(), sideField.getY(), null, nation);
                Map.setField(sideField.getX(), sideField.getY(), sideField);
            }, true);
        });

        Main.emitFields();
        Main.emitNations();

        Main.logger = new Logger();
        $("#sketch .sketch").show();
        $("#sketch #chart").remove();
        $("#toolbar #chartDropdown").hide();
        Main.whatChart = "power";

        $("#powerTextToggleButton").show();
        $("#backButton").show();

        Main.pausedTime = 0;
        $("#pauseButton").prop("disabled", true);
        $("#pauseButton").text("Pause");

        Main.countdown = (Main.onMainMenu ? 0 : Date.now() + 6000); //6s later
        Main.titleMessage = null;
        $("#timer").text("00:00");

        sketch.draw = Main.__draw;
        sketch.update = Main.__update;
        sketch.keydown = Main.__keydown;
        sketch.mousedown = Main.__mousedown;

        sketch.interval = (65 - parseInt($("#intervalNumber").val())) || 5;
        sketch.start();
    },
    launchGame: function(){
        Main.countdown = null;
        Main.titleMessage = null;
        Main.startedTime = Date.now();

        $("#backButton").hide();
        $("#pauseButton").prop("disabled", false);
    },

    emitFields: function(force){
        if(Main.isHost){
            if(force) force.__forceUpdated = true;
            socket.emit("update fields", JSON.stringify(Map.fields));
            if(force) force.__forceUpdated = false;
        }
    },
    emitNations: function(force){
        if(Main.isHost){
            if(force) force.__forceUpdated = true;
            socket.emit("update nations", JSON.stringify(Map.nations));
            if(force) force.__forceUpdated = false;
        }
    },

    drawTitleMessage: function(titleMessage){
        Main.titleMessage = titleMessage || Main.titleMessage;
        if(!Main.titleMessage) return;

        sketch.textAlign = "center";
        sketch.textBaseline = "middle";
        sketch.font = round(sketch.width / 12) + "px Quantico";

        sketch.lineWidth = 10;
        sketch.strokeStyle = Main.backgroundColor;
        sketch.strokeText(Main.titleMessage, sketch.width / 2, sketch.height / 2);

        sketch.fillStyle = "#E0E4CC";
        sketch.fillText(Main.titleMessage, sketch.width / 2, sketch.height / 2);
    },
    onGameOver: function(win){
        if(Main.onMainMenu){
            setTimeout(function(){
                Main.startGame();
            }, floor(random(4000, 6000)));
            return;
        }

        Main.drawTitleMessage(win ? "YOU WIN!" : "GAME OVER");
        sketch.stop();

        $("#pauseButton").prop("disabled", true);
        $("#pauseButton").text(Main.titleMessage);

        setTimeout(function(){
            $("#toolbar #chartDropdown").show();
            $("#powerTextToggleButton").hide();
            Main.showChart();
        }, floor(random(4000, 6000)));
    },

    showChart: function(what){
        $("#sketch .sketch").hide();
        $("#sketch #chart").remove();

        var chartData = Main.logger.toChartData(what || Main.whatChart || "power");

        var width = ceil(Main.logger.max / 20);
        if(width > 10) width -= (width % 10 - 10);

        $('<canvas>').attr("id", "chart").css({ width: sketch.width + "px", height: sketch.height + "px" }).appendTo("#sketch");
        new Chart($("#chart")[0].getContext("2d")).Line(chartData, {
            responsive: true,
            scaleOverride: true,
            scaleStartValue: 0,

            scaleSteps: 20,
            scaleStepWidth: width,
        });
    },

    __draw: function(){
        Map.forEachFields(function(field, x, y){
            field.draw(sketch);
        }, true);

        Map.draw(sketch);
        Main.drawTitleMessage();
    },
    __update: function(){
        if(Main.countdown !== null){
            var seconds = floor((Main.countdown - Date.now()) / 1000);

            if(seconds <= 0) Main.launchGame();
            else Main.titleMessage = seconds;
        }else if(Main.isHost || Main.onMainMenu){
            Map.forEachFields(function(field, x, y){
                field.__updated = false;
                field.update();
            }, true);
        }

        Map.forEachNations(function(nation){
            nation.__updated = false;
            nation.resetCounter();
        }, true);

        Map.forEachFields(function(field, x, y){
            if(field instanceof Field && !field.isEmpty()){
                field.getNation().totalPower += field.getPower();
                field.getNation().totalFields.push(field);

                if(field.getSideFields(true).some(function(sideField){
                    if(sideField === null || !(sideField instanceof Field)) return true;
                    if(sideField.isEmpty() || sideField.getNation() !== field.getNation()) return true;
                })) field.getNation().totalBorderFields.push(field);

                if(field instanceof EnergeField) field.getNation().totalEnergeFields.push(field);
            }
        }, true);

        if(Main.countdown === null) Map.forEachNations(function(nation){
            if(nation.totalFields.length <= 0) nation.onDestroy();
            else if(Main.isHost || Main.onMainMenu) nation.tick();
        }, true);

        Main.emitFields();
        Main.emitNations();

        if(Main.countdown === null){
            var elapsed = floor(abs(Date.now() - Main.startedTime - Main.pausedTime) / 1000);
            var minutes = floor(elapsed / 60) + ":";
            if(minutes.length < 3) minutes = "0" + minutes;

            $("#timer").text(minutes + ("0" + floor(elapsed % 60)).slice(-2));
            Main.logger.log();
        }
    },
    __keydown: function(){
        if(Main.onMainMenu) return;

        if(sketch.keys.SPACE) $("#pauseButton").click();
        if(sketch.keys.ESCAPE || sketch.keys[192 /* ` */]) $("#restartButton").click();

        if(sketch.keys[18 /* Alt*/]) $("#powerTextToggleButton").click();
        if(sketch.keys.ENTER || sketch.keys.Q) $("#navigationToggleButton").click();
    },
    __mousedown: function(){
        if(Main.onMainMenu || Main.countdown !== null) return;

        var x = floor((sketch.mouse.x - Map.leftPadding) / Map.fieldSize);
        var y = floor((sketch.mouse.y - Map.topPadding)  / Map.fieldSize);

        var clickedField = Map.getField(x, y);
        if(clickedField !== null && clickedField instanceof Field && clickedField.onClick()) return;

        if(sketch.running && (Main.onMainMenu || Main.isHost)){
            Map.getPlayerNation().targetField = (clickedField === Map.getPlayerNation().getTargetField()) ? null : clickedField;
            Main.emitNations(Map.getPlayerNation());

            clickedField = null;
        }

        Map.lastClickedTime = Date.now();
        Map.lastClickedField = clickedField;
    }
};

/* ================================================================================================================================ */

var Map = {
    toString: function(){
        return "[object Map]";
    },
    init: function(noEnerge){
        Map.fields = {};
        Map.nations = {};

        var fieldCount = parseInt($("#fieldCountNumber").val());
        Map.fieldSize = floor(min(sketch.width, sketch.height) / (fieldCount || 33));

        Map.width  = floor(sketch.width  / Map.fieldSize);
        Map.height = floor(sketch.height / Map.fieldSize);

        Map.width  -= (1 - Map.width  % 2);
        Map.height -= (1 - Map.height % 2);

        Map.leftPadding = round((sketch.width  - Map.fieldSize * Map.width)  / 2);
        Map.topPadding  = round((sketch.height - Map.fieldSize * Map.height) / 2);

        var percentage = parseFloat($("#energePercentageNumber").val()) + 1;
        Map.forEachFields(function(field, x, y){
            if(field !== null) return;

            var NewField = (!noEnerge && random(100) < ((percentage || 6) - 1)) ? EnergeField : Field;
            Map.setField(x, y, new NewField(x, y));
        });
    },
    draw: function(context){
        var nations = [];
        this.forEachNations(function(nation){
            nation.draw(context);
            nations.push(nation);
        }, true);

        nations.sort(function(a, b){
            return b.totalPower - a.totalPower;
        });

        $("#navigation #status tbody").empty();
        nations.forEach(function(nation){
            if(nation.totalFields.length > 0) $("#navigation #status tbody").append('<tr style="color: ' + nation.getColor() + ';"><td>' + nation.getName() + "</td><td>" + nation.totalPower + "</td><td>" + round(nation.totalPower / nation.totalFields.length) + "</td><td>" + nation.totalEnergeFields.length + "</td><td>" + nation.totalFields.length + "</td></tr>");
        });
    },

    fields: {},
    getField: function(x, y){
        if(x < 0 || y < 0 || x >= Map.width || y >= Map.height) return null;
        return this.fields[x + ':' + y] || null;
    },
    setField: function(x, y, field){
        this.fields[x + ':' + y] = field;
        return field;
    },
    forEachFields: function(callback, ignoreNull, x1, x2, y1, y2){
        ignoreNull = ignoreNull || false;

        x1 = x1 || 0;
        y1 = y1 || 0;

        x2 = x2 || Map.width;
        y2 = y2 || Map.height;

        if(x1 < 0) x1 = 0;
        if(y1 < 0) y1 = 0;

        if(x2 > Map.width) x2 = Map.width;
        if(y2 > Map.height) y2 = Map.height;

        for(var x = x1; x < x2; x++){
            for(var y = y1; y < y2; y++){
                var field = Map.getField(x, y);
                if(field === null && ignoreNull) continue;
                if(callback(field, x, y)) return;
            }
        }
    },

    playerColor: null,

    nations: {},
    getNation: function(color){
        return this.nations[color] || null;
    },
    getPlayerNation: function(){
        return this.getNation(this.playerColor);
    },
    setNation: function(color, nation){
        this.nations[color] = nation;
        return nation;
    },
    forEachNations: function(callback, ignoreNull){
        ignoreNull = ignoreNull || false;

        for(var i = 0; i < Nation.STANDARD.length; i++){
            var nation = Map.getNation(Nation.STANDARD[i].color);
            if(nation === null && ignoreNull) continue;
            if(callback(nation, Nation.STANDARD[i])) return;
        }
    }
};

/* ================================================================================================================================ */

function Logger(){
    this.data = [];
}

Logger.prototype.toString = function(){
    return "[object Logger]";
};
Logger.prototype.log = function(){
    var label = $("#timer").text();
    if(this.data.length > 0 && label === this.data[this.data.length - 1].label) return;

    var nations = [];
    Map.forEachNations(function(nation, standard){
        nations.push({
            power:        (nation && nation.totalPower)                                    || 0,
            average:      (nation && round(nation.totalPower / nation.totalFields.length)) || 0,
            energeFields: (nation && nation.totalEnergeFields.length)                      || 0,
            fields:       (nation && nation.totalFields.length)                            || 0
        });
    }, false);

    this.data.push({ label: label, nations: nations });
};
Logger.prototype.toChartData = function(what, step){
    what = what || "power";
    step = step || 10;

    var chartData = { labels: [], datasets: [] };
    Map.forEachNations(function(nation, standard){
        chartData.datasets.push({
            label:                (nation && nation.getName()) || standard.name,
            fillColor:            rgba(standard.color, "0.2"),
            strokeColor:          standard.color,
            pointColor:           standard.color,
            pointStrokeColor:     "#ffffff",
            pointHighlightFill:   "#ffffff",
            pointHighlightStroke: standard.color,
            data: []
        });
    }, false);

    var that = this; that.max = 0;
    this.data.forEach(function(data, index){
        if(index % step) return;

        chartData.labels.push(data.label);
        data.nations.forEach(function(nation, i){
            chartData.datasets[i].data.push(nation[what]);
            if(that.max < nation[what]) that.max = nation[what];
        });
    });

    return chartData;
};

/* ================================================================================================================================ */

function Nation(index, color, darkColor, name){
    this.index = index;
    this.color = color;
    this.darkColor = darkColor || color;
    this.name = name;

    this.__updated = true;
    this.resetCounter();
}

Nation.STANDARD = [
    {index: 0, color: "#E91E63", dark: "#C2185B", name: "Pink",   text: "#fff"},
    {index: 1, color: "#9C27B0", dark: "#7B1FA2", name: "Purple", text: "#fff"},
    {index: 2, color: "#3F51B5", dark: "#303F9F", name: "Indigo", text: "#fff"},
    {index: 3, color: "#009688", dark: "#00796B", name: "Teal",   text: "#000"},
    {index: 4, color: "#8BC34A", dark: "#689F38", name: "Green",  text: "#000"}, //Light Green
    {index: 5, color: "#FFC107", dark: "#FFA000", name: "Amber",  text: "#000"},
    {index: 6, color: "#795548", dark: "#5D4037", name: "Brown",  text: "#fff"},
    {index: 7, color: "#607D8B", dark: "#455A64", name: "Grey",   text: "#fff"} //Blue Grey
];

Nation.prototype.toString = function(){
    return "[object Nation]";
};
Nation.prototype.toJSON = function(){
    return (this.__updated || this.__forceUpdated) ? [this.getTargetField() ? [this.getTargetField().getX(), this.getTargetField().getY()] : null] : undefined;
};

Nation.prototype.getColor = function(){
    return this.color;
};
Nation.prototype.getDarkColor = function(){
    return this.darkColor;
};
Nation.prototype.getName = function(){
    return this.name;
};
Nation.prototype.isPlayer = function(){
    return this.getColor() === Map.playerColor;
};
Nation.prototype.getTargetField = function(){
    return this.targetField || null;
};
Nation.prototype.resetCounter = function(){
    this.totalPower = 0;
    this.totalFields = [];
    this.totalEnergeFields = [];
    this.totalBorderFields = [];
};
Nation.prototype.tick = function(){
    if(this.isPlayer()) return;
    var that = this;

    var range = floor(min(Map.width, Map.height) * (isBaby ? 0.25 : 0.5));
    var isBaby = that.totalFields.length < (4 * range);

    if(!this.getTargetField() && this.totalBorderFields.length > 0 && (isBaby ? true : floor(random(5)) < 1)){
        var field = random(this.totalBorderFields);

        Map.forEachFields(function(f){
            if(f.getNation() === field.getNation()) return;
            if(f instanceof EnergeField && (isBaby === f.isEmpty())){
                if(!that.targetField || (isBaby ?
                    (f.isEmpty() && that.targetField.distance(field) > f.distance(field)) :
                    (!f.isEmpty() && that.targetField.getPower() > f.getPower())
                )) that.targetField = f;
            }
        }, true, field.getX() - range, field.getX() + range, field.getY() - range, field.getY() + range);

        if(this.getTargetField()) Main.emitFields(this);
    }else if(this.totalBorderFields.every(function(borderField){ return borderField.distance(that.targetField) > floor(min(Map.width, Map.height) * 0.5); })){
        this.targetField = null;
        Main.emitFields(this);
    }
};
Nation.prototype.onInvade = function(field){
    field.__updated = true;
    if(field === this.targetField){
        this.targetField = null;
        this.__updated = true;
    }
};
Nation.prototype.onDestroy = function(){
    Map.setNation(this.getColor(), null);
    if(this.isPlayer()) return Main.onGameOver(false);

    var nations = []; Map.forEachNations(function(nation){ nations.push(nation); }, true);
    if(nations.length === 1 && (Main.onMainMenu || nations[0].isPlayer())) Main.onGameOver(true);
};

Nation.prototype.draw = function(context){
    if(this.totalBorderFields) this.totalBorderFields.forEach(function(borderField){
        borderField.drawRoundedCorners(context);
    });

    if(!this.getTargetField()) return;

    this.__angle = this.__angle || 0;
    this.__angle %= 360;

    context.lineCap = "round";
    context.lineWidth = Map.fieldSize * 0.08;

    context.strokeStyle = this.getDarkColor();
    this.getTargetField().drawArc(context, "stroke", 0.88, this.__angle, this.__angle + 150);

    this.__angle += 20 + random(30);
};

/* ================================================================================================================================ */

function Field(x, y, power, nation){
    this.x = x;
    this.y = y;
    this.power = power || 0;
    this.nation = nation || null;

    this.__updated = true;
}

//  * N N *
//  W 3 0 E
//  W 2 1 E
//  * S S *


Field.CORNERS = [
    /* 0 */ [Direction.NORTH, Direction.NORTHEAST, Direction.EAST, 1, 2, 3],
    /* 1 */ [Direction.SOUTH, Direction.SOUTHEAST, Direction.EAST, 0, 3, 2],
    /* 2 */ [Direction.SOUTH, Direction.SOUTHWEST, Direction.WEST, 3, 0, 1],
    /* 3 */ [Direction.NORTH, Direction.NORTHWEST, Direction.WEST, 2, 1, 0]
];

Field.synchronizePower = function(a, b, force){
    var sum = a.getPower() + b.getPower();

    if(!force && sum >= 5 && !a.isEmpty()){
        var targetField = a.getNation().getTargetField();

        var aDistance = a.distance(targetField);
        var bDistance = b.distance(targetField);

        if(!isEqualNumber(aDistance, bDistance)){
            var nearField = aDistance < bDistance ? a : b;
            var farField  = aDistance < bDistance ? b : a;

            farField.power = floor(sum / 5);
            nearField.power = sum - farField.power;

            farField.__updated = nearField.__updated = true;
            return;
        }
    }

    a.power = floor(sum / 2);
    b.power = sum - a.power;
    a.__updated = b.__updated = true;
};

Field.prototype = {
    toString: function(){
        return "[object Field]";
    },
    toJSON: function(){
        return (this.__updated || this.__forceUpdated) ? [this.getPower(), this.isEmpty() ? -1 : this.getNation().index] : undefined;
    },

    getX: function(){
        return this.x;
    },
    getY: function(){
        return this.y;
    },
    getPower: function(){
        return this.power;
    },
    getNation: function(){
        return this.nation;
    },
    getColor: function(){
        return (this.getNation() && this.getNation().getColor()) || Main.backgroundColor;
    },
    isEmpty: function(){
        return this.nation === null;
    },

    getSideField: function(direction){
        var xx = 0;
        var yy = 0;

        if(direction & Direction.CENTER_HORIZONTAL) xx = 0;
        if(direction & Direction.CENTER_VERTICAL) yy = 0;

        if(direction & Direction.UP) yy = -1;
        else if(direction & Direction.DOWN) yy = 1;

        if(direction & Direction.LEFT) xx = -1;
        else if(direction & Direction.RIGHT) xx = 1;

        return Map.getField(this.getX() + xx, this.getY() + yy);
    },
    getSideFields: function(diagonal){
        var that = this;
        return (diagonal ? Direction.EIGHT : Direction.FOUR).map(function(direction){
            return that.getSideField(direction);
        }).concat(this);
    },
    forEachSides: function(callback, diagonal){
        var that = this;
        return (diagonal ? Direction.EIGHT : Direction.FOUR).forEach(function(direction){
            callback(that.getSideField(direction), direction);
        });
    },
    distance: function(x, y){
        if(x instanceof Field){
            y = x.getY();
            x = x.getX();
        }
        return sqrt(pow(this.getX() - x, 2) + pow(this.getY() - y, 2));
    },

    drawRect: function(context, method){
        context[method + "Rect"](Map.leftPadding + Map.fieldSize * this.getX(), Map.topPadding + Map.fieldSize * this.getY(), Map.fieldSize, Map.fieldSize);
    },
    drawArc: function(context, method, radius, start, end, close){
        start = start || 0;
        end = end || 360;

        context.beginPath();
        context.arc(Map.leftPadding + (this.getX() + 0.5) * Map.fieldSize, Map.topPadding + (this.getY() + 0.5) * Map.fieldSize, floor(radius * (Map.fieldSize / 2)), start / 180 * PI, end / 180 * PI);
        if(close) context.closePath();

        context[method]();
    },
    drawText: function(context, method, text, font){
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = ceil(Map.fieldSize / 3) + "px " + (font || "Inconsolata");

        context[method + "Text"](text, Map.leftPadding + (this.getX() + 0.5) * Map.fieldSize, Map.topPadding + (this.getY() + 0.5) * Map.fieldSize);
    },
    drawPath: function(context, method, direction, xxx, yyy){
        var xx = 0.5;
        var yy = 0.5;

        if(direction & Direction.CENTER_HORIZONTAL) xx = 0.5;
        if(direction & Direction.CENTER_VERTICAL) yy = 0.5;

        if(direction & Direction.UP) yy = 0;
        else if(direction & Direction.DOWN) yy = 1;

        if(direction & Direction.LEFT) xx = 0;
        else if(direction & Direction.RIGHT) xx = 1;

        var x = Map.leftPadding + (this.getX() + xx) * Map.fieldSize + (xxx || 0);
        var y = Map.topPadding  + (this.getY() + yy) * Map.fieldSize + (yyy || 0);

        if(method) context[method + "To"](x, y);
        return {x: x, y: y};
    },

    draw: function(context){
        this.drawBackground(context);
        this.drawAnything(context);
        this.drawPowerText(context);
        //this.drawBorder(context);
    },
    drawBackground: function(context){
        context.fillStyle = this.getColor();
        this.drawRect(context, "fill");
    },
    drawRoundedCorners: function(context){
        var that = this;

        var oColor = that.getColor();
        var oPower = that.getPower();

        Field.CORNERS.forEach(function(directions, index){
            var sideFields = directions.map(function(direction){ return that.getSideField(direction); });
            var sideColors = sideFields.map(function(sideField){
                return (sideField && sideField.getColor()) || Main.backgroundColor;
            });

            var targetFields     = [];
            var targetDirections = [];
            var targetColor      = Main.backgroundColor;

            //     B
            //  A     C
            //     O

            var a = 0, b = 1, c = 2, aa = 3, bb = 4, cc = 5;

            var oa =        oColor === sideColors[a];
            var ob =        oColor === sideColors[b];
            var oc =        oColor === sideColors[c];
            var ab = sideColors[a] === sideColors[b];
            var bc = sideColors[b] === sideColors[c];
            var ac = sideColors[a] === sideColors[c];

            if(oa && ob && oc) return; //OABC
            if(!oa && !ob && !oc && !ab && !bc && !ac) return; //1:1:1:1
            if((oa && bc && !ab) || (oc && ab && !bc)) return; //2:2

            var aPower = (sideFields[a] && sideFields[a].getPower()) || 0;
            var bPower = (sideFields[b] && sideFields[b].getPower()) || 0;
            var cPower = (sideFields[c] && sideFields[c].getPower()) || 0;

            if(ab && bc && !ob){ //O vs ABC
                targetFields     = [that];
                targetDirections = [directions];
                targetColor      = sideColors[b];
            }else if(oa && oc && !ob){ //OAC vs B
                targetFields     = [sideFields[b]];
                targetDirections = [Field.CORNERS[directions[bb]]];
                targetColor      = oColor;
            }else if(ob && ac && !ab){ //OB vs AC (crossed)
                var ourPower   = oPower + bPower;
                var theirPower = aPower + cPower;

                if(ourPower === theirPower) return;
                else if(ourPower > theirPower){
                    targetFields     = [sideFields[a], sideFields[c]];
                    targetDirections = [Field.CORNERS[directions[aa]], Field.CORNERS[directions[cc]]];
                    targetColor      = oColor;
                }else return;
            }else if(!ob && ac && !oa && !ab){ //O vs AC vs B (crossed)
                targetFields     = [that, sideFields[b]];
                targetDirections = [directions, Field.CORNERS[directions[bb]]];
                targetColor      = sideColors[a];
            }else if(!oa && !oc && ab && !bc){ //AB vs O vs C
                if(oPower === cPower) return;
                else if(oPower > cPower){
                    targetFields     = [sideFields[c]];
                    targetDirections = [Field.CORNERS[directions[cc]]];
                    targetColor      = oColor;
                }else{
                    targetFields     = [that];
                    targetDirections = [directions];
                    targetColor      = sideColors[c];
                }
            }else if(!oa && !oc && !ab && bc){ //BC vs O vs A
                if(oPower === aPower) return;
                else if(oPower > aPower){
                    targetFields     = [sideFields[a]];
                    targetDirections = [Field.CORNERS[directions[aa]]];
                    targetColor      = oColor;
                }else{
                    targetFields     = [that];
                    targetDirections = [directions];
                    targetColor      = sideColors[a];
                }
            }

            for(var i = 0; i < targetFields.length; i++) if(targetFields[i]) targetFields[i].drawRoundedCorner(context, targetDirections[i], targetColor);
        });
    },
    drawRoundedCorner: function(context, directions, color){
        var radius = floor(Map.fieldSize * 0.3);
        context.fillStyle = color;

        context.beginPath();
        this.drawPath(context, "move", directions[0]);
        this.drawPath(context, "line", directions[1], (directions[1] & Direction.WEST) ? radius : -radius);

        var start = this.drawPath(context, null, directions[1]);
        var end   = this.drawPath(context, null, directions[2]);
        context.arcTo(start.x, start.y, end.x, end.y, radius);

        this.drawPath(context, "line", directions[1]);
        this.drawPath(context, "line", directions[0]);

        context.closePath();
        context.fill();
    },
    drawAnything: function(context){
        //Not implemented
    },
    drawPowerText: function(context){
        if(Main.onMainMenu || !Main.showPowerText) return;

        context.fillStyle = Main.backgroundColor;
        this.drawText(context, "fill", this.getPower());
    },
    drawBorder: function(context){
        var that = this;
        this.forEachSides(function(sideField, direction){
            if(sideField === null || !(sideField instanceof Field)) return;
            if(that.getNation() === sideField.getNation()) return;

            var start, end;
            switch(direction){
                case Direction.UP:
                    start = Direction.LEFT  | Direction.UP;
                    end   = Direction.RIGHT | Direction.UP;
                    break;
                case Direction.RIGHT:
                    start = Direction.UP   | Direction.RIGHT;
                    end   = Direction.DOWN | Direction.RIGHT;
                    break;
                case Direction.DOWN:
                    start = Direction.LEFT  | Direction.DOWN;
                    end   = Direction.RIGHT | Direction.DOWN;
                    break;
                case Direction.LEFT:
                    start = Direction.UP   | Direction.LEFT;
                    end   = Direction.DOWN | Direction.LEFT;
                    break;

                default: return;
            }

            context.lineCap = "round";
            context.lineWidth = Map.fieldSize * 0.06;
            context.strokeStyle = Main.backgroundColor;

            context.beginPath();
            that.drawPath(context, "move", start);
            that.drawPath(context, "line", end);
            context.stroke();
        });
    },

    onClick: function(){
        console.log(this);
    },

    update: function(){
        if(this.isEmpty()) return;

        var sideField = this.getSideField(random(Direction.FOUR));
        if(sideField === null || !(sideField instanceof Field)) return;

        if(sideField instanceof EnergeField) this.contactWithEnerge(sideField)
        else if(sideField.isEmpty()) this.contactWithEmptyField(sideField);
        else this.contactWithTerritory(sideField);
    },
    contactWithEmptyField: function(field){
        if(this.power <= 500) return;

        this.power -= 500;
        this.__updated = true;

        //extend my territory
        field.nation = this.getNation();
        this.getNation().onInvade(field);
    },
    contactWithEnerge: function(energeField){
        //empty field, now it's mine
        if(energeField.isEmpty()){
            energeField.nation = this.getNation();
            this.getNation().onInvade(energeField);
        }

        //enemy's territory
        else if(this.getNation() !== energeField.getNation()){
            if(this.power <= 400) return;

            this.power -= 400;
            this.__updated = true;

            //invade!
            energeField.nation = this.getNation();
            this.getNation().onInvade(energeField);
        }

        //synchronize!
        Field.synchronizePower(this, energeField);
    },
    contactWithTerritory: function(territoryField){
        //my territory
        if(this.getNation() === territoryField.getNation()) Field.synchronizePower(this, territoryField);

        //enemy's territory and enough money to invade
        else if(this.getPower() > territoryField.getPower() && this.getPower() > 300){
            this.power -= 300;
            this.__updated = true;

            territoryField.power = floor(territoryField.power * 0.8);

            //invade!
            territoryField.nation = this.getNation();
            this.getNation().onInvade(territoryField);
        }
    }
};

/* ================================================================================================================================ */

function EnergeField(x, y, power, nation, level){
    Field.call(this, x, y, power || 200 + floor(random(200)), nation);
    this.level = level || 0;
}

EnergeField.prototype = new Field();
EnergeField.prototype.constructor = EnergeField;
EnergeField.prototype.toString = function(){
    return "[object EnergeField]";
};
EnergeField.prototype.toJSON = function(){
    var superJSON = Field.prototype.toJSON.call(this);
    return (superJSON === undefined) ? undefined : superJSON.concat(this.level);
};

EnergeField.prototype.drawAnything = function(context){
    var that = this;
    this.forEachSides(function(sideField, direction){
        if(sideField === null || !(sideField instanceof EnergeField)) return;
        if(that.isEmpty() || sideField.isEmpty() || that.getNation() === sideField.getNation()){
            context.beginPath();
            that.drawPath(context, "move", Direction.CENTER);
            that.drawPath(context, "line", direction);
            context.closePath();

            context.lineWidth = floor(Map.fieldSize * 0.05);
            context.strokeStyle = "#0097A7";
            context.stroke();
        }
    });

    context.fillStyle = this.level ? "#03A9F4" : "#00BCD4";
    this.drawArc(context, "fill", 0.7);
};
EnergeField.prototype.update = function(){
    if(!this.isEmpty()){
        this.power += floor((this.level ? 20 : 5) + random(10));
        this.__updated = true;
    }

    var that = this;
    this.forEachSides(function(sideField, direction){
        if(sideField === null || !(sideField instanceof EnergeField)) return;
        if(that.isEmpty() || sideField.isEmpty() || that.getNation() === sideField.getNation()) Field.synchronizePower(that, sideField);
    });

    Field.prototype.update.call(this);
};
EnergeField.prototype.onClick = function(){
    Field.prototype.onClick.call(this);

    if(!this.isEmpty() && this.getNation().isPlayer()){
        var x = this.getX();
        var y = this.getY();

        if(sketch.keys.SHIFT){
            Map.setField(x, y, new Field(x, y, floor(this.getPower() * 1.5), this.getNation()));
            return true;
        }else if(sketch.keys[17]){ //Ctrl
            Map.setField(x, y, new Field(x, y));
            Map.forEachFields(function(field, x, y){
                field.power = max(1, floor(field.power * 0.01));
                field.__updated = true;
            }, true, x - 5, x + 6, y - 5, y + 6);
            return true;
        }
    }
}

/* ================================================================================================================================ */

var isVirgin = true;

var socket = io.connect();
socket.on('update fields', function(data){
    if(Main.isHost || Main.onMainMenu) return; data = JSON.parse(data);
    if(isVirgin){
        Map.forEachFields(function(f, x, y){
            Map.setField(x, y, new Field(x, y));
        });
        isVirgin = false;
    }

    for(var key in data){
        if(!data.hasOwnProperty(key)) continue;

        var axis = key.split(":");
        var x = parseInt(axis[0]);
        var y = parseInt(axis[1]);

        var fieldJSON = data[key];
        var power = fieldJSON[0];
        var nation = (fieldJSON[1] < 0) ? null : Map.getNation(Nation.STANDARD[fieldJSON[1]].color);

        var field = Map.getField(x, y);
        if(fieldJSON.length === 3 && (field === null || !(field instanceof EnergeField))){
            Map.setField(x, y, new EnergeField(x, y, power, nation, fieldJSON[2]));
        }else if(fieldJSON.length === 2 && (field === null || (field instanceof EnergeField))){
            Map.setField(new Field(x, y, power, nation));
        }else{
            field.power = power;
            field.nation = nation;
        }
    }
});
socket.on('update nations', function(data){
    if(Main.isHost || Main.onMainMenu) return; data = JSON.parse(data);

    for(var key in data){
        if(!data.hasOwnProperty(key)) continue;

        var nationJSON = data[key];
        if(nationJSON === null) Map.setNation(key, null);
        else{
            var nation = Map.getNation(key);
            if(nationJSON[0] === null) nation.targetField = null;
            else nation.targetField = Map.getField(nationJSON[0][0], nationJSON[0][1]);
        }

    }
});

//END OF FILE
