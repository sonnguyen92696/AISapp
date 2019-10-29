///////////////////////////////////////
// TOP LEVEL MISCELLANEOUS FUNCTIONS //
///////////////////////////////////////
var scenarioMenuView = $( "#selectmenuView" );
scenarioMenuView.selectmenu();
scenarioMenuView.on( "selectmenuselect", function( event, ui ) {
    application.changeToView(ui.item.value);
});

$("#btn_Misc_apply").on( "click", function() {
    application.applyUIDetails();
});

var scenarioMenuPlugin = $( "#selectmenuPlugin" );
scenarioMenuPlugin.selectmenu();
scenarioMenuPlugin.on( "selectmenuselect", function( event, ui ) {
    console.log('scenarioMenuPlugin.on( selectmenuselect, function( event, ui )');
    //console.log(ui);
    //console.log(event);
});

var scenarioMenuType = $( "#selectmenuType" );
scenarioMenuType.selectmenu();
scenarioMenuType.on( "selectmenuselect", function( event, ui ) {
    console.log('scenarioMenuType.on( selectmenuselect, function( event, ui )');
});