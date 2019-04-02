var mysql = require('mysql');
//var firebase = require("firebase");
var admin = require("firebase-admin");

var serviceAccount = require("./cred/kolo-18c1d-firebase-adminsdk-7t8qu-bbfa8a1c9d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kolo-18c1d.firebaseio.com"
});

var mysql_pool = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.IP,
    user     : 'sw3g',
    password : '',
    database : 'c9',
    debug    :  false
});
 
 
function debug_showconnections () {
    var date = new Date();
    console.log('request' + date.getSeconds());
}

exports.generateTopByLocation = function (req, res) {
    //debug_showconnections();
    if (!req.is('application/json') || req.body.token == null) {
        res.status(400).end();
    }
    
    if (!(req.body.location && req.body.location.lat != null && req.body.location.lng != null &&
                    -90 <= req.body.location.lat && req.body.location.lat <= 90 && 
                    -180 <= req.body.location.lng && req.body.location.lng <= 180)) { 
                res.status(400).end();
    }
    
    var token = req.body.token;
    decodeToken(res, token, function (res, decodedToken) {
        if (decodedToken != null){
            
            var SQL_prefs = 'SELECT blau, rot, dist FROM uprefs WHERE uid = ?';
            var SQL_prefs_params = [decodedToken.uid];
            
            dosql(res, SQL_prefs, SQL_prefs_params, function (res, prefs) {
                
                //TODO distance maximum
                var distance = prefs[0]["dist"];
                var SQL_pois = `
                SELECT poi_id, name, geo_lat, geo_lng, distance, blau, rot
                FROM (
                    SELECT db.poi_id, db.name, db.geo_lat, db.geo_lng, db.blau, db.rot, p.radius,
                        p.distance_unit 
                            * DEGREES(ACOS(COS(RADIANS(p.loc_lat))
                            * COS(RADIANS(db.geo_lat))
                            * COS(RADIANS(p.loc_lng - db.geo_lng))
                            + SIN(RADIANS(p.loc_lat))
                            * SIN(RADIANS(db.geo_lat)))) AS distance
                    FROM pois as db
                    JOIN ( 
                        SELECT ? AS loc_lat, ? AS loc_lng, ? AS radius, 111.045 AS distance_unit
                    ) AS p
                    WHERE 
                        db.geo_lat BETWEEN p.loc_lat - (p.radius / p.distance_unit) 
                            AND p.loc_lat + (p.radius / p.distance_unit)
                        AND db.geo_lng BETWEEN p.loc_lng - (p.radius / (p.distance_unit * COS(RADIANS(p.loc_lat))))
                            AND p.loc_lng + (p.radius / (p.distance_unit * COS(RADIANS(p.loc_lat))))
                        AND db.available = 1
                ) AS d
                WHERE distance <= radius
                ORDER BY distance
                LIMIT 30`
    
                var SQL_pois_params = [req.body.location.lat, req.body.location.lng, distance];
    
                dosql(res, SQL_pois, SQL_pois_params, function (res, data) {
                    
                    var response = {data: []};
                    
                    for (var i = 0; i < data.length; i++) {
                        if ((data[i]["blau"] == prefs[0]["blau"]) || (data[i]["rot"] == prefs[0]["rot"])) {
                            response.data.push(data[i]);
                        }
                    }
                    res.setHeader('content-type', 'application/json');
                    res.send(response);
                });
            });
        } else {
            //invalid token
        }
    });
}
  
exports.findById = function (req, res) {
    var sql_query = 'SELECT * FROM pois WHERE poi_id = ?';
    var sql_params = [req.params.poi_id];

    dosql(res, sql_query, sql_params, function (res, data) {
        res.setHeader('content-type', 'application/json');
        res.send({data});
    });
}

exports.showStatesByIdList = function (req, res) {
    if (!req.is('application/json') || req.body.list == null) {
        res.status(400).end();
    }
    
    var sql_query = 'SELECT poi_id, available FROM pois WHERE poi_id IN (';
    var sql_params = [req.params.poi_id];
    
    sql_query += mysql.escape(req.body.list[0].poi_id);
    for (var i = 1; i < req.body.list.length; i++) {
        sql_query += ',' + mysql.escape(req.body.list[i].poi_id);
    }
    sql_query += ');';
    
    dosql(res, sql_query, sql_params, function (res, data) {
        res.setHeader('content-type', 'application/json');
        res.send({data});
    });
}

exports.showStateById = function (req, res) {
    var sql_query = 'SELECT poi_id, available FROM pois WHERE poi_id = ?';
    var sql_params = [req.params.poi_id];
    
    dosql(res, sql_query, sql_params, function (res, data) {
        res.setHeader('content-type', 'application/json');
        res.send({data});
    });
}

exports.testlistall = function (req, res) {
    var sql_query = 'SELECT * FROM pois';
    
    dosql(res, sql_query, [], function (res, data) {
        res.setHeader('content-type', 'application/json');
        res.send({data});
    });
}

exports.userSetPrefs = function (req, res) {
    if (!req.is('application/json') || req.body.token == null || req.body.user_prefs == null) {
        res.statusCode = 400;
        return;
    }
    var token = req.body.token;
    decodeToken(res, token, function (res, decodedToken) {
        if (decodedToken != null){
            
            //valid user/token
            var SQL_insertUser = `
                INSERT INTO uprefs(uid, rot, blau, dist) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE rot=?, blau=?, dist=?;`;
            
            var SQL_insertUser_params = [decodedToken.uid, 
                req.body.user_prefs.rot, 
                req.body.user_prefs.blau,
                req.body.user_prefs.dist,
                
                req.body.user_prefs.rot, 
                req.body.user_prefs.blau,
                req.body.user_prefs.dist];
                
            dosql(res, SQL_insertUser, SQL_insertUser_params, function (res, data) {
                res.setHeader('content-type', 'application/json');
                res.send({'success': true})
            });
            
            //res.setHeader('content-type', 'application/json');
            //res.send({'success': true});
        }else{
            //invalid token
            
            res.setHeader('content-type', 'application/json');
            res.send({'success': false})
        }
        
    });
}


function dosql (res, sql_query, sql_params_toescape, callback) {
    mysql_pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
      
            console.log("sql connection error");
            res.statusCode = 500;
            res.send('database connection error');
        }   
  
        //console.log('connected as id ' + connection.threadId);

        connection.query(sql_query, sql_params_toescape, function (err, rows) {
            connection.release();
            if (err) {
                console.log("sql query error");
                res.statusCode = 400;
                res.send('sql query error');
            } else {
                callback(res, rows);
            }
        });
    });
}

function decodeToken (res, idToken, callback) {
    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        //console.log(decodedToken);
        callback(res, decodedToken);
    }).catch(function(error) {
        callback(res, null);
    });
}

exports.logRequest = function (req, res) {
    res.setHeader('content-type', 'application/json');
    
    console.log(req.body);
    res.send(req.body);
}