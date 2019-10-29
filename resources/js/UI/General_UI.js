var _ws_url = "https://maritime.latrobe.edu.au/api/v5/";
var api = null;

window.onload = onLoadFunction();

function onLoadFunction(){

    api = new AIS_Client("FA74Ir7V0H", _ws_url);
    application = new Application({api: api});
    loadPlaylists();
}

$(function(){
    $("<hr/>").insertAfter( ".dark > h2" );
})
function loadPlaylists(){
    // populate playlist menu
    api.getPlaylists(undefined,
        function(data){
        data = data || [];
            appendOptionToSelect(-2, "... select other playlist", "selectmenuP");
            for (var i = 0; i < data.length; i++) {
                appendOptionToSelect(data[i]["idplaylist"], data[i]["name"], "selectmenuP")
            }

        },
        function(error){
            alert("ERROR loading playlists: " + JSON.stringify(error));
        });

    // disable "delete playlist" button
    $("#btnDeleteP").prop('disabled', true);

    // populate scenario menu
    populateSessionSelect(undefined);
}

function appendOptionToSelect(value, innerHTML, name){
    var option = document.createElement('option');
    option.value = value;
    option.innerHTML = innerHTML;
    document.getElementById(name).appendChild(option);
}

function removeOptionFromSelect(selectID, value){
    $('#' + selectID + 'option[value="' + value + '"]').remove();
    $("#selectmenuP").val("-1").selectmenu('refresh');
    $("#btnDeleteP").prop('disabled', true);
}
