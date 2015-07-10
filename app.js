// Filename: app.js

var BITCASA_ACCESS_TOKEN = '';
var BITCASA_ENDPOINT = '';
var FOLDER_NAME = 'drawit';
var PORT = 8080;

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var url = require('url');

var folderId = '';

var app = express();
app.use(bodyParser());
app.listen(PORT);

// Locate the folder to store the drawings in.
if(folderId == '') {
  request({
    url: 'https://'+BITCASA_ENDPOINT+'/v2/folders/?operation=create',
    headers: {
      'Authorization': 'Bearer '+BITCASA_ACCESS_TOKEN,
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf8'
    },
    form: {
      name: FOLDER_NAME,
      exists: 'fail'
    },
    method: 'POST'},function(error, response, body) {
      if(error) {
        console.log(error);
        process.exit(1);
      }

      var js = JSON.parse(body);
      
      if(js.error) {
        if(js.error.code == 2042) {
          folderId = js.error.data.conflicting_id;  
        } else {
          console.log('Cannot find drawing folder: '+js.error.message);
          process.exit(1);
        }
      } else {
        folderId = js.result.items[0].id;
      }

      console.log('Using folder: '+folderId);
  });
}

app.post('/api/upload', function(req, res) {
  var base64Data = req.body.image.replace(/^data:image\/png;base64,/,'');
  var binaryData = new Buffer(base64Data, 'base64');

  var timeNow = new Date();
  request({
    url: 'https://'+BITCASA_ENDPOINT+'/v2/files/'+folderId,
    headers: {
      'Authorization': 'Bearer '+BITCASA_ACCESS_TOKEN,
      'Content-Type': 'multipart/form-data'
    },
    formData: {
      file: {
        value: binaryData,
        options: {
          filename: 'drawing_'+timeNow.valueOf()+'.png',
          contentType: 'image/png'
        }
      }
    },
    method: 'POST'
  }, function(error, response, body) {
    if(error) {
      res.send({error: 'Unable to save image'});
      return;
    }

    var js = JSON.parse(body);

    if(js.error) {
      res.send({error: js.error.message});
      return;
    }
    
    res.send({id: js.result.id});
  });
});

app.get('/image', function(req, res) {
  var query = url.parse(req.url, true).query;
  var body = '';

  var r = request({
    url: 'https://'+BITCASA_ENDPOINT+'/v2/files/'+folderId+'/'+query.id,
    headers: {
      'Authorization': 'Bearer '+BITCASA_ACCESS_TOKEN,
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf8 '
    },
    method: 'GET'
  });
  r.end();
  
  r.on('response', function(response) {
    response.setEncoding('binary');
    response.on('end', function() {
      if(response.statusCode == 404) {
        res.status(404);
        res.send('Not found');
        return;
      }

      res.setHeader('Content-Type', response.headers['content-type']);
      res.send(new Buffer(body, 'binary'));
    });
    response.on('data', function (chunk) {
      if(response.statusCode == 200) body += chunk;
    });
  });
});

app.use(express.static(__dirname + '/public'));

console.log('Application listening on port '+PORT);