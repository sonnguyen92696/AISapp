// Helper Functions
// ----------------
var ShowDiv = {};
ShowDiv.update = function (name){
    var discard = $( "#rectScenarioDiscard");
    discard.hide("blind", {}, 1);
    var saveas = $( "#rectScenarioSaveAs");
    saveas.hide("blind", {}, 1);
    var del = $( "#rectScenarioDelete");
    del.hide( "blind", {}, 1);
    var create = $( "#rectScenarioCreate" );
    create.hide( "blind", {}, 1);

    switch(name){
        case "rectScenarioDiscard":
            discard.show("blind", {}, 500);
            break;
        case "rectScenarioSaveAs":
            saveas.show("blind", {}, 500);
            break;
        case "rectScenarioDelete":
            del.show( "blind", {}, 500);
            break;
        case "rectScenarioCreate":
            create.show( "blind", {}, 500);
            break;
    }
};

function populateSessionSelect(playlistID){
    if(playlistID === undefined){
        api.getScenarios(undefined,
            function(data){
            data = data || [];
                for (var i = 0; i < data.length; i++) {
                    appendOptionToSelect(data[i]["idscenario"], data[i]["idscenario"], "selectmenuS")
                }

                $("#selectmenuS").val($("#selectmenuS option:first").val()).selectmenu("refresh");
            },
            function(error){
                alert("ERROR loading scenarios: " + JSON.stringify(error));
            });
    }
    else {
        api.getPlaylistsWithScenarios(playlistID,
            function (data) {
                var first = {};

                for (var i = 0; i < data.length; i++) {
                    if (data[i]["idprev"] == null) {
                        first = data[i];
                        break;
                    }
                }

                var sorted = [];
                sorted.push(first);
                if (data.length > 1) {
                    sorted = sortScenarios(first, data, sorted);
                }
                for (var i = 0; i < sorted.length; i++) {
                    appendOptionToSelect(sorted[i]["idscenario"],
                        (sorted[i]["scenario_name"] !== null) ? sorted[i]["scenario_name"] : sorted[i]["idscenario"],
                        "selectmenuS")
                }

                var firstValue = $("#selectmenuS option:first").val();

                $("#selectmenuS").val(firstValue).selectmenu("refresh");

                application.loadScenarioIntoCesium({
                    scenarioID: firstValue
                });
            },
            function (error) {
                alert("ERROR loading scenarios: " + JSON.stringify(error));
            });
    }
}

// this is only necessary if playlist_items.index is NOT used
function sortScenarios(current, list, sortedList){
    var next;

    for (var i = 0; i < list.length; i++){
        if(current["idnext"] === list[i]["idscenario"]){
            next = list[i];
            sortedList.push(next);
            break;
        }
    }

    if(next["idnext"] === null){
        return sortedList;
    }
    else{
        return sortScenarios(next, list, sortedList);
    }
}


//////////////////////////////////
// TOP LEVEL SCENARIO FUNCTIONS //
//////////////////////////////////
var scenarioMenu = $( "#selectmenuS" );
scenarioMenu
    .selectmenu({
        select: function( event, ui ) {
            application.loadScenarioIntoCesium({
                scenarioID: $("#selectmenuS").val()
            })
        },
        width: 160
    })
    .selectmenu("menuWidget")
    .addClass("overflow");

$( "#btnSaveS" ).on( "click", function() {
    /*
    var scenarioID = $("#selectmenuS").val();
    var values = {} // todo: get time and location constraints
    api.updateScenario(scenarioID, values,
        function(data){

        },
        function(error){
            alert("ERROR updating scenario: " + JSON.stringify(error));
        }) */
});

$( "#btnDeleteS" ).on( "click", function() {
    this.update("rectScenarioDelete");
}.bind(ShowDiv));

$( "#btnPrevS" ).on( "click", function() {
    var isFirstElementSelected = $('#selectmenuS > option:selected').index() == 0;
    if (!isFirstElementSelected){
        $("#selectmenuS > option:selected")
            .prop("selected", false)
            .prev()
            .prop("selected", true);
        $('#selectmenuS').selectmenu("refresh");
    }

    // todo: warn if changes were made
    var changes = false;
    if(changes){
        this.update("rectScenarioDiscard");
    }
}.bind(ShowDiv));

$( "#btnNextS" ).on( "click", function() {
    var isLastElementSelected = $('#selectmenuS > option:selected').index() == $('#selectmenuS > option').length -1;
    if (!isLastElementSelected) {
        $("#selectmenuS > option:selected")
            .prop("selected", false)
            .next()
            .prop("selected", true);
        $('#selectmenuS').selectmenu("refresh");
    }

    // todo: warn if changes were made
    var changes = false;
    if(changes){
        this.update("rectScenarioDiscard");
    }
}.bind(ShowDiv));

$( "#btnSaveAsS" ).on( "click", function() {
    this.update("rectScenarioSaveAs");
}.bind(ShowDiv));

$( "#btnCreateS" ).on( "click", function() {
    this.update("rectScenarioCreate");
}.bind(ShowDiv));



// Discard Warning Functions
// -------------------------
$( "#btn_D_Open" ).on( "click", function() {
    $("#rectScenarioDiscard").hide("blind", {}, 500);
});

$( "#btn_D_Cancel" ).on( "click", function() {
    $("#rectScenarioDiscard").hide("blind", {}, 500);
});



// Save As Functions
// -----------------
var scenarioMenuPlaylist = $( "#selectmenuSSA" );
scenarioMenuPlaylist.selectmenu();
scenarioMenuPlaylist.on( "selectmenuselect", function( event, ui ) {
});

$( "#btn_SSA_Save" ).on( "click", function() {
    // todo add scenario
    // todo add playlist_item
    $("#rectScenarioSaveAs").hide("blind", {}, 500);
});

$( "#btn_SSA_Cancel" ).on( "click", function() {
    $("#rectScenarioSaveAs").hide("blind", {}, 500);
});



// Delete Functions
// ----------------
$( "#btn_DS_Delete" ).on( "click", function() {
    // todo delete scenario
    // todo delete playlist_item
    // todo update remaining playlist_items if any

    $("#rectScenarioDelete").hide("blind", {}, 500);
});

$( "#btn_DS_Cancel" ).on( "click", function() {
    $("#rectScenarioDelete").hide("blind", {}, 500);
});



// Create Functions
// ----------------

// Tab - Session
$( "#tab_SC" ).tabs();

$( "#btn_SCS_search" ).on( "click", function() {
});

$( "#btn_SCS_Display" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

$( "#btn_SCS_Cancel" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

// Tab - Maneuverability
var session_SCM_menu = $( "#selectmenu_SCM_session" );
session_SCM_menu.selectmenu({
    select: function( event, ui ) {},
    width: 160
});

var uom_SCM_menu = $( "#selectmenu_SCM_uom" );
uom_SCM_menu.selectmenu({
    select: function( event, ui ) {},
    width: 60
});

$( "#btn_SCM_Find" ).on( "click", function() {
});

$( "#btn_SCM_All" ).on( "click", function() {
});

$( "#btn_SCM_None" ).on( "click", function() {
});

$( "#btn_SCM_Clear" ).on( "click", function() {
});

$( "#btn_SCM_Display" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

$( "#btn_SCM_Cancel" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

// Tab - Busy Day
var session_SCB_menu = $( "#selectmenu_SCB_session" );
session_SCB_menu.selectmenu({
    select: function( event, ui ) {},
    width: 160
});

var uom_SCB_menu = $( "#selectmenu_SCB_uom" );
uom_SCB_menu.selectmenu({
    select: function( event, ui ) {},
    width: 60
});

$( "#btn_SCB_Find" ).on( "click", function() {
});

$( "#btn_SCB_All" ).on( "click", function() {
});

$( "#btn_SCB_None" ).on( "click", function() {
});

$( "#btn_SCB_Clear" ).on( "click", function() {
});

$( "#btn_SCB_Display" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

$( "#btn_SCB_Cancel" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

// Tab - Close Encounter
var session_SCC_menu = $( "#selectmenu_SCC_session" );
session_SCC_menu.selectmenu({
    select: function( event, ui ) {},
    width: 160
});

var uom_SCC_menu = $( "#selectmenu_SCC_uom" );
uom_SCC_menu.selectmenu({
    select: function( event, ui ) {},
    width: 60
});

$( "#btn_SCC_Find" ).on( "click", function() {
});

$( "#btn_SCC_All" ).on( "click", function() {
});

$( "#btn_SCC_None" ).on( "click", function() {
});

$( "#btn_SCC_Clear" ).on( "click", function() {
});

$( "#btn_SCC_Display" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});

$( "#btn_SCC_Cancel" ).on( "click", function() {
    $("#rectScenarioCreate").hide("blind", {}, 500);
});



