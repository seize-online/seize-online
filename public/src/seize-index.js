$(function(){
    $("#refs").attr("href", "https://github.com/seize-online/seize-online/commit/" + $("#refs").text());
    $("#refs").text($("#refs").text().substring(0, 7));

    $("#singleplayButton").click(function(){
        window.location.href = "/room";
    });

    $("#settingsButton").click(function(){
        window.location.href = "/help";
    });
});
