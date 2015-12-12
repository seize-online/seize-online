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
    window.location.href = "/";
});

$("#restartButton").click(function(){
    Main.startGame();
});

$("#timer").css("opacity", "1.0");
$("#chartDropdown .dropdown-menu").on('click', 'li a', function(){
    $("#chartDropdownButton").html($(this).text() + ' <span class="caret" />');
    Main.whatChart = $(this).attr("what");
    Main.showChart();
});
