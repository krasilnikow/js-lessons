/**
 * Created by Andrew on 02.03.2016.
 */
var http = require('http');
var fs = require('fs');
var formidable = require('formidable');
var xmlData;

var server = http.createServer(function(request, response){
   if (request.method == 'POST') {
      if (request.url.includes('getInputXml')) {
         fs.readFile(request.url, function (e, d) {
            getData(response);
         });
      }
      else if (request.url.includes('saveXml')){
         var form = new formidable.IncomingForm();
         form.parse(request, function(err, fields, files) {
            saveData(response, { Parameter: JSON.parse(fields.xml) });
         });
      }
      return;
   }
   var filePath = false;
   if (request.url == '/'){
      filePath = 'public/index.html';
   }
   else{
      filePath = 'public' + request.url;
   }
   var absPath = './' + filePath;
   serverStatic(response, absPath);
}).listen(8888, function(){
   console.info('Server listening on port 8888');
});

function serverStatic(response, absPath) {
   fs.exists(absPath, function (exists) {
      if (!exists) {
         send404(response);
         return;
      }
      fs.readFile(absPath, function (err, data) {
         if (err) {
            send404(response);
         }
         else {
            sendFile(response, absPath, data);
         }
      });
   });
}
function send404(response){
   response.writeHead(404, {'Content-Type': 'text/plain'});
   response.write('Error 404: resource not found');
   response.end();
}

function sendFile(response, filePath, fileContents){
   if (filePath.includes('.css')){
      console.log(fileContents);
   }
   response.writeHead( 200, {"Content-Type": filePath.includes('.css') ? 'text/css' : 'text/html'});
   response.end(fileContents);
}
function getData(response){
   var xml2js = require('xml2js');
   var parser = new xml2js.Parser();
   fs.readFile(__dirname + '/public/data/input.xml', function(err, data) {
      parser.parseString(data, function (err, result) {
         xmlData = result.Parameters;
         response.end(JSON.stringify(result.Parameters.Parameter));
      });
   });
}

function saveData(response, data){
   var js2xmlparser = require("js2xmlparser");
   var xmlData = js2xmlparser("Parameters", data);
   console.log(xmlData);
   fs.open("public/data/output.xml", "w", '0644', function(err, file_handle) {
      if (!err) {
         fs.write(file_handle, xmlData, 0, 'utf8', function(err, written) {
            if (!err) {
               response.end('done!');
            } else {
               response.end('recording error!');
            }
            fs.close(file_handle);
         });
      } else {
         response.end('open error!');
      }
   });
}