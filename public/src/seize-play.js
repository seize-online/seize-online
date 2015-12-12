$(window).on("beforeunload", function(){
    return onMainMenu ? undefined : "You will lose all the game progess.";
});
