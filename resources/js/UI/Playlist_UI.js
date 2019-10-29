// Helper Functions
// ----------------
var ShowDiv = {};
ShowDiv.update = function (name){
    $( "#rectPlaylistCreate").hide("blind", {}, 1);
    $( "#rectPlaylistDel").hide("blind", {}, 1);
    $( "#rectPlaylistOpen").hide( "blind", {}, 1);
    $( "#rectPlaylistExport").hide( "blind", {}, 1);

    switch(name){
        case "rectPlaylistCreate":
            $( "#rectPlaylistCreate").show("blind", {}, 500);
            break;
        case "rectPlaylistDel":
            $( "#rectPlaylistDel").show("blind", {}, 500);
            break;
        case "rectPlaylistOpen":
            $( "#rectPlaylistOpen").show( "blind", {}, 500);
            break;
        case "rectPlaylistExport":
            $( "#rectPlaylistExport").show( "blind", {}, 500);
            break;
    }
};



//////////////////////////////////
// TOP LEVEL PLAYLIST FUNCTIONS //
//////////////////////////////////
/*var ele = document.getElementById("rectPlaylist"),
    eleStyle = ele.currentStyle;
var eleWidth = eleStyle.width * 0.5;*/
var playlistMenu = $( "#selectmenuP" );
playlistMenu.selectmenu({
    width: 160
});

playlistMenu.on( "selectmenuselect", function( event, ui ) {
    console.log("playlistMenu.selectmenuselect");

    var playlistID = $("#selectmenuP option:selected").val();
    switch(playlistID){
        case "-1": // select a playlist
            // disable "delete playlist" button
            $("#btnDeleteP").prop('disabled', true);
            $("#selectmenuS").empty();
            populateSessionSelect(undefined);
            break;
        case "-2": // select other playlist
            this.update("rectPlaylistOpen");
            break;
        default:
            $("#selectmenuS").empty();
            populateSessionSelect(playlistID);
            $("#btnDeleteP").prop('disabled', false);
    }

    //if($("#selectmenuP option:selected").text() == "... select other playlist"){
    //    this.update("rectPlaylistOpen");
    //}
}.bind(ShowDiv));

$( "#btnDeleteP" ).on( "click", function() {
    var selectmenuP = document.getElementById("selectmenuP");
    var playlistName = selectmenuP.options[selectmenuP.selectedIndex].text;
    document.getElementById("txt_PD").textContent = "Are you sure you want to delete playlist '" +
        playlistName + "' and its scenarios?";

    this.update("rectPlaylistDel");
    return false;
}.bind(ShowDiv));

$( "#btnCreateP" ).on( "click", function() {
    this.update("rectPlaylistCreate");
    return false;
}.bind(ShowDiv));

$( "#btnExportP" ).on( "click", function() {
    this.update("rectPlaylistExport");
    return false;
}.bind(ShowDiv));



// Delete Playlist Functions
// -------------------------
$( "#btn_PD_Cancel" ).on( "click", function() {
    $( "#rectPlaylistDel" ).hide( "blind", {}, 500 );
    return false;
});

$( "#btn_PD_Del" ).on( "click", function() {
    var playlistID = $("#selectmenuP").val();
    var api = new AIS_Client("FA74Ir7V0H", _ws_url);
    api.deletePlaylist(playlistID, true,
        function(data){
            removeOptionFromSelect("selectmenuP", playlistID);
            populateSessionSelect(undefined);
        },
        function(error){
            alert("ERROR deleting playlist: " + JSON.stringify(error));
        });

    $( "#rectPlaylistDel" ).hide( "blind", {}, 500 );
    return false;
});



// Open Playlist Functions
// -----------------------
$( "#btn_PO_Search" ).on( "click", function() {

});

$( "#btn_PO_Open" ).on( "click", function() {
    $("#selectmenuP").val("-1").selectmenu('refresh'); // later select the actually opened playlist
    $( "#rectPlaylistOpen" ).hide( "blind", {}, 500 );
    return false;
});

$( "#btn_PO_Cancel" ).on( "click", function() {
    $("#selectmenuP").val("-1").selectmenu('refresh');
    $( "#rectPlaylistOpen" ).hide( "blind", {}, 500 );
    return false;
});



// Create Playlist Functions
// -------------------------
$( "#btn_PC_Save" ).on( "click", function() {
    var name = document.getElementById("input_PCC_name").value;
    var api = new AIS_Client("FA74Ir7V0H", _ws_url);
    api.addPlaylists([{"name" : name}],
        function(data){
            appendOptionToSelect(data[0]["idmessage"], name, "selectmenuP");
            $("#selectmenuP").val(data[0]["idmessage"]).selectmenu('refresh');
        },
        function(error){alert("ERROR creating playlist: " + JSON.stringify(error));}
        );
    $( "#rectPlaylistCreate" ).hide( "blind", {}, 500 );
    return false;
});

$( "#btn_PC_Cancel" ).on( "click", function() {
    $( "#rectPlaylistCreate" ).hide( "blind", {}, 500 );
    return false;
});



// Export Playlist Functions
// -------------------------
$( "#btn_PE_Save_Save" ).on( "click", function() {
    $( "#rectPlaylistExport" ).hide( "blind", {}, 500 );
    return false;
});

$( "#btn_PE_Cancel" ).on( "click", function() {
    $( "#rectPlaylistExport" ).hide( "blind", {}, 500 );
    return false;
});

$( "#btn_PE_Browse" ).on( "click", function() {
    return false;
});



