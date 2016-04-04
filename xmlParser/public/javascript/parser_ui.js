/**
 * Created by Andrew on 03.04.2016.
 */
let parserApp = new Parser();
$(document).ready(function(){
   $.ajax({
      url: 'getInputXml'
   }).done(function( data ) {
      parserApp.setData(data);
      parserApp.drawData($('#parserAppContainer'));
   });
});