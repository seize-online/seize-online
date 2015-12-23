/* =============================== bootstrap-number-button =============================== */

var bootstrapNumber = function(selector, options){
    function changeHandler(){
        var value = parseInt($(this).val());

        if(isNaN(value)) $(this).val($(this).attr("value"));
        if(options.odd && (value % 2) === 0) $(this).val(value - 1);
        if(options.min && value < options.min) $(this).val(options.min);
        if(options.max && value < options.max) $(this).val(options.max);

        Main.startGame();
    }

    $(selector).bootstrapNumber(options);
    $(selector).change(changeHandler).focusout(changeHandler).click(function(){
        $(this).attr("value", $(this).val()); $(this).val("");
    });

    var maxWidth = max($(selector).prev().children(0).width(), $(selector).children(0).next().width());
    $(selector).prev().children(0).width(maxWidth); $(selector).next().children(0).width(maxWidth);
};

/* =============================== #container =============================== */

$(function(){
    Nation.STANDARD.forEach(function(standard){
        $("#colorGroup").append('<button type="button" class="btn btn-lg" id="colorButton" style="color: ' + standard.text + '; background-color: ' + standard.color + '; border-color: ' + standard.dark + ';">' + standard.name + '</button>');

        var maxWidth = 0; $("#colorGroup > button").each(function(){
            maxWidth = max(maxWidth, $(this).width());
        }); $("#colorGroup > button").width(maxWidth + 1);
    });

    var selectedStandard = null;
    $("button#colorButton").click(function(){
        $("button#colorButton").css('opacity', '0.1');
        $("button#colorButton").prop('disabled', false);

        $(this).css('opacity', '1');
        $(this).prop('disabled', true);

        var name = $(this).text();
        Nation.STANDARD.forEach(function(standard){
            if(standard.name === name) selectedStandard = standard;
        });
    });

    bootstrapNumber("#fieldCountNumber", {
        upClass: "success btn-lg", downClass: "success btn-lg",
        upText: "+", downText: "-", center: true, min: 15, odd: true
    });
    bootstrapNumber("#energePercentageNumber", {
        upClass: "primary btn-lg", downClass: "primary btn-lg",
        upText: "+", downText: "-", center: true
    });
    bootstrapNumber("#intervalNumber", {
        upClass: "danger btn-lg", downClass: "danger btn-lg",
        upText: "+", downText: "-", center: true
    });

    $("#roomNameInput").validator({ delay: 0 });
});

/* =============================== window =============================== */

$(window).bind("beforeunload", function(){
    return "You will lose all the game progess.";
});

$(function(){
    $("#sketch").css("bottom", $("#toolbar").outerHeight() + "px");

    $("#copyright").hide("slow");
    $("#refs").hide("fast");
});

/* =============================== #navigation =============================== */

var navigationPadding = 12;
$("#navigation").css("top", navigationPadding + "px");
$("#navigation").css("left", navigationPadding + "px");

var lastNavigationMovement = 0;
$("#navigation").hover(function(){
    if(Date.now() - lastNavigationMovement < 500) return;

    if($(this).css("right") === (navigationPadding + "px")){
        $(this).css("bottom", "");
        $(this).css("right", "");
        $(this).css("top", navigationPadding + "px");
        $(this).css("left", navigationPadding + "px");
    }else{
        $(this).css("top", "");
        $(this).css("left", "");
        $(this).css("bottom", (navigationPadding + $("#toolbar").outerHeight()) + "px");
        $(this).css("right", navigationPadding + "px");
    }
    lastNavigationMovement = Date.now();
});

/* =============================== #toolbar =============================== */

var pauseStartedTime = 0;
$("#pauseButton").click(function(){
    if(!Main.isHost || Main.hasClients) return;
    if(Main.countdown !== null) return;

    if(sketch.running){
        $("#pauseButton").text("Resume");
        pauseStartedTime = Date.now();

        sketch.stop();
        Main.drawTitleMessage("Paused");
    }else{
        $("#pauseButton").text("Pause");
        Main.pausedTime += abs(Date.now() - pauseStartedTime);

        Main.titleMessage = null;
        sketch.start();
    }
});

$("#navigationToggleButton").click(function(){
    $("#navigation").toggle("slow", function(){
        $("#navigationToggleButton").text($("#navigation").is(":hidden") ? "Show navigation" : "Hide navigation");
    });
});

$("#powerTextToggleButton").click(function(){
    Main.showPowerText = !Main.showPowerText;
    $("#powerTextToggleButton").text(Main.showPowerText ? "Hide power text" : "Show power text");

    sketch.draw();
});

$("#quitButton").click(function(){
    if(Main.isHost && Main.hasClients) socket.emit('game over');
    window.location.href = "/";
});

$("#restartButton").click(function(){
    if(!Main.isHost || Main.hasClients) return;
    Main.startGame();
});

$("#timer").css("opacity", "1.0");
$("#chartDropdown .dropdown-menu").on('click', 'li a', function(){
    $("#chartDropdownButton").html($(this).text() + ' <span class="caret" />');
    Main.whatChart = $(this).attr("what");
    Main.showChart();
});

/* ================================================================================================================================ */

var socket = io.connect();

socket.on('game ready', function(data){
    Main.isHost = data.isHost;
    Main.hasClients = data.hasClients;
});

socket.on('game start', function(data){
    Map.forEachFields(function(f, x, y){
        Map.setField(x, y, new Field(x, y));
    });
});

socket.on('update fields', function(data){
    data = JSON.parse(data);
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
    data = JSON.parse(data);
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
