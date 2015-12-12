/* ================================================================================================================================ */

var bootstrapNumber = function(selector, options){
    function changeHandler(){
        var value = parseInt($(this).val());

        if(isNaN(value)) $(this).val($(this).attr("value"));
        if(options.min && value < options.min) $(this).val(options.min);
        if(options.max && value < options.max) $(this).val(options.max);
    }

    $(selector).bootstrapNumber(options);
    $(selector).change(changeHandler).focusout(changeHandler).click(function(){
        $(this).attr("value", $(this).val()); $(this).val("");
    });

    var maxWidth = max($(selector).prev().children(0).width(), $(selector).children(0).next().width());
    $(selector).prev().children(0).width(maxWidth); $(selector).next().children(0).width(maxWidth);
};

/* =============================== #container =============================== */

Nation.STANDARD.forEach(function(standard){
    $("#colorGroup").append('<button type="button" class="btn btn-lg" id="colorButton" style="color: ' + standard.text + '; background-color: ' + standard.color + '; border-color: ' + standard.dark + ';">' + standard.name + '</button>');

    var maxWidth = 0; $("#colorGroup > button").each(function(){
        maxWidth = max(maxWidth, $(this).width());
    }); $("#colorGroup > button").width(maxWidth);
});

var selectedStandard = null;
$("button#colorButton").click(function(){
    $("button#colorButton").prop('disabled', false);
    $(this).prop('disabled', true);

    var name = $(this).text();
    Nation.STANDARD.forEach(function(standard){
        if(standard.name === name) selectedStandard = standard;
    });
});

bootstrapNumber("#fieldCountNumber", {
    upClass: "success btn-lg", downClass: "success btn-lg",
    upText: "+", downText: "-", center: true, min: 15
});
bootstrapNumber("#energePercentageNumber", {
    upClass: "primary btn-lg", downClass: "primary btn-lg",
    upText: "+", downText: "-", center: true
});
bootstrapNumber("#intervalNumber", {
    upClass: "danger btn-lg", downClass: "danger btn-lg",
    upText: "Slower", downText: "Faster", center: true
});
$(".numberWrapper").width($("#colorGroup").width());

/* ================================================================================================================================ */

onMainMenu = true;
Main.startGame();
