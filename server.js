var restify = require('restify');

var api = require('./api.js');
/*
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
*/

var server = restify.createServer({
    name: 'KoloBackend'
    
});

server.use(restify.bodyParser({ mapParams: false })); // mapped in req.body


server.get('/api/listall', api.testlistall);
server.post('/api/top', api.generateTopByLocation);
server.get('/api/list/:poi_id', api.findById);
server.post('/api/state', api.showStatesByIdList);
server.get('/api/state/:poi_id', api.showStateById);

server.post('/api/changePrefs', api.userSetPrefs);


//debug
server.post('/api/logPostRequest', api.logRequest);

server.listen(process.env.PORT, function() {
  console.log('listening at %s', process.env.PORT);
});