///////////////////////////////
// TOP LEVEL TOOLS FUNCTIONS //
///////////////////////////////
$( "#btn_H_settings" ).on( "click", function() {
});

/**
 * This function updates the UI (text boxes only) to display the filter
 * @callback updateFilters
 * @param {object} filter
 * @param {string} [filter.latMin]
 * @param {string} [filter.latMax]
 * @param {string} [filter.longMin]
 * @param {string} [filter.longMax]
 * @param {string} [filter.timeStart]
 * @param {string} [filter.timeEnd]
 *
 */
function updateFilters(filter){
   //update UI
   if(filter.hasOwnProperty("latMin"))
       $("#input_TPR_latMin").val(filter.latMin);
   if(filter.hasOwnProperty("latMax"))
       $("#input_TPR_latMax").val(filter.latMax);
   if(filter.hasOwnProperty("longMin"))
       $("#input_TPR_longMin").val(filter.longMin);
   if(filter.hasOwnProperty("longMax"))
       $("#input_TPR_longMax").val(filter.longMax);

   if(filter.hasOwnProperty("timeStart"))
       $("#dp_TPR_Start").val(filter.timeStart);
   if(filter.hasOwnProperty("timeEnd"))
       $("#dp_TPR_End").val(filter.timeEnd);
}

$( "#btn_TPR_select" ).on( "click", function() {
    application.beginSelectOnMap(updateFilters);
});

$('#input_TPR_latMin').bind('input', function() {
    /* This will be fired every time, when input_TPR_latMin's value changes. */
    application.latLongFilterUpdate({
        latMin:$("#input_TPR_latMin").val(),
        latMax:$("#input_TPR_latMax").val(),
        longMin:$("#input_TPR_longMin").val(),
        longMax:$("#input_TPR_longMax").val()
    });
} );
$('#input_TPR_latMax').bind('input', function() {
    /* This will be fired every time, when input_TPR_latMax's value changes. */
    application.latLongFilterUpdate({
        latMin:$("#input_TPR_latMin").val(),
        latMax:$("#input_TPR_latMax").val(),
        longMin:$("#input_TPR_longMin").val(),
        longMax:$("#input_TPR_longMax").val()
    });
} );
$('#input_TPR_longMin').bind('input', function() {
    /* This will be fired every time, when input_TPR_longMin's value changes. */
    application.latLongFilterUpdate({
        latMin:$("#input_TPR_latMin").val(),
        latMax:$("#input_TPR_latMax").val(),
        longMin:$("#input_TPR_longMin").val(),
        longMax:$("#input_TPR_longMax").val()
    });
} );
$('#input_TPR_longMax').bind('input', function() {
    /* This will be fired every time, when input_TPR_latMin's value changes. */
    application.latLongFilterUpdate({
        latMin:$("#input_TPR_latMin").val(),
        latMax:$("#input_TPR_latMax").val(),
        longMin:$("#input_TPR_longMin").val(),
        longMax:$("#input_TPR_longMax").val()
    });
} );

$('#btn_TPR_apply').on( "click", function() {
    application.applyFilters({
        latMin:$("#input_TPR_latMin").val(),
        latMax:$("#input_TPR_latMax").val(),
        longMin:$("#input_TPR_longMin").val(),
        longMax:$("#input_TPR_longMax").val(),
        timeStart:$("#dp_TPR_Start").val(),
        timeEnd:$("#dp_TPR_End").val(),
    });
} );

//equivalent to $(document).ready( function() {...
/*
$( function() {
    $( "#dp_TPR_Start" ).datepicker();
} );

//equivalent to $(document).ready( function() {...
$( function() {
    $( "#dp_TPR_End" ).datepicker();
} );
*/

/**
 * @callback updateTextField
 * @param {string} text
 */
// add the outer anonymous function to the list of functions run on document ready event

$(document).ready(function() {
    // add this anonymous function to the on click event for the HTML object with id=btn_TPR_select_start_on_time_line
    $("#btn_TPR_select_start_on_time_line").click(
        function(){
            console.log('btn_TPR_select_start_on_time_line clicked');
            //get a reference to the clicked button
            var btn = $("#btn_TPR_select_start_on_time_line");
            if (btn.text() === "Set") {
                //toggle button text to prompt the user to click it again
                btn.html("Pick");
                //call application pickTimeOnTimeLine and give it a callback that can set the text in the date time start input field
                application.pickTimeOnTimeLine(function(text){
                    $("#dp_TPR_Start").val(text);
                    if (moment($("#dp_TPR_Start").val()).isValid() && moment($("#dp_TPR_End").val()).isValid())
                    {
                        if (moment($("#dp_TPR_Start").val()).isBefore(moment($("#dp_TPR_End").val())))
                        {
                            $("#dp_TPR_Start").css('color', 'green');
                            $("#dp_TPR_End").css('color', 'green');
                        }
                        else
                        {
                            $("#dp_TPR_Start").css('color', 'red');
                            $("#dp_TPR_End").css('color', 'red');
                        }
                    }
                }, false);
            }
            else
            {
                //toggle button text to prompt the user to click it again
                btn.html("Set");
                //if thw other time picker is mid pick it will be stopped so change its text back to 'Pick'
                if ( $("#btn_TPR_select_end_on_time_line").text() === "Set") $("#btn_TPR_select_end_on_time_line").html("Pick");
                application.pickTimeOnTimeLine(function(text){
                    console.log("callback(" + text + ")");
                    $("#dp_TPR_Start").val(text);
                    if (moment($("#dp_TPR_Start").val()).isValid() && moment($("#dp_TPR_End").val()).isValid())
                    {
                        if (moment($("#dp_TPR_Start").val()).isBefore(moment($("#dp_TPR_End").val())))
                        {
                            $("#dp_TPR_Start").css('color', 'green');
                            $("#dp_TPR_End").css('color', 'green');
                        }
                        else
                        {
                            $("#dp_TPR_Start").css('color', 'red');
                            $("#dp_TPR_End").css('color', 'red');
                        }
                    }
                }, true);
            }
        }
    );
});

// add the outer anonymous function to the list of functions run on document ready event
$(document).ready(function() {
    // add this anonymous function to the on click event for the HTML object with id=btn_TPR_select_end_on_time_line
    $("#btn_TPR_select_end_on_time_line").click(
            function(){
            console.log('btn_TPR_select_end_on_time_line clicked');
            //get a reference to the clicked button
            var btn = $("#btn_TPR_select_end_on_time_line");
            if (btn.text() === "Set") {
                //toggle button text to prompt the user to click it again
                btn.html("Pick");
                //call application pickTimeOnTimeLine and give it a callback that can set the text in the date time start input field
                application.pickTimeOnTimeLine(function(text){
                    $("#dp_TPR_End").val(text);
                    if (moment($("#dp_TPR_Start").val()).isValid() && moment($("#dp_TPR_End").val()).isValid())
                    {
                        if (moment($("#dp_TPR_Start").val()).isBefore(moment($("#dp_TPR_End").val())))
                        {
                            $("#dp_TPR_Start").css('color', 'green');
                            $("#dp_TPR_End").css('color', 'green');
                        }
                        else
                        {
                            $("#dp_TPR_Start").css('color', 'red');
                            $("#dp_TPR_End").css('color', 'red');
                        }
                    }
                }, false);
            }
            else
            {
                //toggle button text to prompt the user to click it again
                btn.html("Set");
                //if thw other time picker is mid pick it will be stopped so change its text back to 'Pick'
                if ( $("#btn_TPR_select_start_on_time_line").text() === "Set") $("#btn_TPR_select_start_on_time_line").html("Pick");
                application.pickTimeOnTimeLine(function(text){
                    console.log("callback(" + text + ")");
                    $("#dp_TPR_End").val(text);
                    if (moment($("#dp_TPR_Start").val()).isValid() && moment($("#dp_TPR_End").val()).isValid())
                    {
                        if (moment($("#dp_TPR_Start").val()).isBefore(moment($("#dp_TPR_End").val())))
                        {
                            $("#dp_TPR_Start").css('color', 'green');
                            $("#dp_TPR_End").css('color', 'green');
                        }
                        else
                        {
                            $("#dp_TPR_Start").css('color', 'red');
                            $("#dp_TPR_End").css('color', 'red');
                        }
                    }
                }, true);
            }
        }
    );
});

$( "#btn_TPR_apply" ).on( "click", function() {
    application.applySpaceTimeFilter({

        latMin:parseFloat($("#input_TPR_latMin").val()),
        latMax:parseFloat($("#input_TPR_latMax").val()),

        longMin:parseFloat($("#input_TPR_longMin").val()),
        longMax:parseFloat($("#input_TPR_longMax").val()),

        timeStart:new moment($("#dp_TPR_Start").val()).toDate(),
        timeEnd:new moment($("#dp_TPR_End").val()).toDate()
    });
});
