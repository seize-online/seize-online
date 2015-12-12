$("#singleplayButton").click(function(){
    window.location.href = "/room";
});

/* ================================================================================================================================ */

var onMainMenu = true;
Main.startGame();

$("#refs").attr("href", "https://github.com/seize-online/seize-online/commit/" + $("#refs").text());
$("#refs").text($("#refs").text().substring(0, 7));
