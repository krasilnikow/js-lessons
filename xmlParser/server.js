/**
 * Created by Andrew on 02.03.2016.
 */

'use strict'
var http = require('http');
var fs = require('fs');
var formidable = require('formidable');
var xmlData;

var server = http.createServer(function (request, response) {
   if (request.url.includes('.xml')) {
      fs.readFile('public/data/output.xml', function (err, data) {
         response.writeHead(200, {"Content-Type": 'text/xml'});
         response.end(data);
      });
      return;
   }
   if (request.method == 'POST') {
      if (request.url.includes('getInputXml')) {
         fs.readFile(request.url, function (e, d) {
            getData(response);
         });
      }
      else if (request.url.includes('saveXml')) {
         var form = new formidable.IncomingForm();
         form.parse(request, function (err, fields, files) {
            saveData(response, {Parameter: JSON.parse(fields.xml)});
         });
      }
      return;
   }
   var filePath = false;
   if (request.url == '/') {
      filePath = 'public/index.html';
   }
   else {
      filePath = 'public' + request.url;
   }
   var absPath = './' + filePath;
   serverStatic(response, absPath);
}).listen(process.env.PORT || 8888, function () {
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
function send404(response) {
   response.writeHead(404, {'Content-Type': 'text/plain'});
   response.write('Error 404: resource not found');
   response.end();
}

function sendFile(response, filePath, fileContents) {
   response.writeHead(200, {"Content-Type": 'text/html'});
   response.end(fileContents);
}
function getData(response) {
   let xml2js = require('xml2js');
   let parser = new xml2js.Parser();
   fs.readFile(__dirname + '/public/data/input.xml', function (err, data) {
      parser.parseString(data, function (err, result) {
         xmlData = result.Parameters;
         response.end(JSON.stringify(result.Parameters.Parameter));
      });
   });
}

function saveData(response, data) {
   let js2xmlparser = require("js2xmlparser");
   let xmlData = js2xmlparser("Parameters", data);
   let errors = validate(data);
   if (errors.count){
      response.end(JSON.stringify(errors));
      return;
   }
   fs.open("public/data/output.xml", "w", '0644', function (err, file_handle) {
      if (!err) {
         fs.write(file_handle, xmlData, 0, 'utf8', function (err, written) {
            if (!err) {
               response.end('done!');
            } else {
               response.end('{error: recording error!}');
            }
            fs.close(file_handle);
         });
      } else {
         response.end('{error: open error!}');
      }
   });
}

function validate(data) {
   let errors = {
      count: 0
   };
   let hasTrueBoolean = false;
   for (let i = 0, l = data.Parameter.length; i < l; i++) {
      let row = data.Parameter[i];
      switch (row.Type){
         case 'System.Int32':
            if ((+row.Value < -255 || +row.Value > 255) && !errors.intRange){
               errors.intRange = 'int values must be in range(-255,255)';
               errors.count++;
            }
            break;
         case 'System.String':
            if ((row.Value.length > 15) && !errors.stringLength){
               console.log(row.Value);
               errors.stringLength = 'String length must be less 15 symbols';
               errors.count++;
            }
            break;
         case 'System.Boolean':
            if (row.Value){
               hasTrueBoolean = true;
            }
            break;
      }
   }
   if (!hasTrueBoolean){
      errors.booleanHasTrueValue = 'At least one boolean parameter value must be true';
      errors.count++;
   }
   return errors;
}