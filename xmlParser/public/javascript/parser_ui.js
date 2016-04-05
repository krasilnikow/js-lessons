/**
 * Created by Andrew on 03.04.2016.
 */
'use strict';
let parserApp = new Parser();
$(document).ready(function(){
   parserApp.getData().done(function( data ) {
      parserApp.setData(data);
      parserApp.drawData($('#parser'));
   });
});

function setCommand(command){
   parserApp[command] && parserApp[command]();
}