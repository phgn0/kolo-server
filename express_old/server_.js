var express = require('express');
var app = express();

var api = require('./api.js');

app.use(express.static('public'));
app.use(express.bodyParser());

//app.get('/', function (req, res) {
//  res.sendfile('/public/index.html', {root: __dirname })
//});

app.listen(process.env.PORT, function () {
  console.log('listening on port ', process.env.PORT);
});

app.post('/api/top', api.generateTopByLocation);
app.get('/api/list/:poi_id', api.findById);
app.post('/api/state', api.showStatesByIdList);
app.get('/api/state/:poi_id', api.showStateById);
app.get('/api/listall', api.testlistall);