var mysql = require('mysql');

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
    debug_showconnections();
    
    if (!req.is('application/json')) {
        res.status(400).end();
    }
    
    if (!(req.body.location && req.body.location.lat != null && req.body.location.lng != null &&
            -90 <= req.body.location.lat && req.body.location.lat <= 90 && 
            -180 <= req.body.location.lng && req.body.location.lng <= 180)) { 
        
        res.status(400).end();
    }
    
    var distance = 3;
    var sql_query = `
        SELECT poi_id, name, geo_lat, geo_lng, distance
        FROM (
            SELECT db.poi_id, db.name, db.geo_lat, db.geo_lng, p.radius,
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
    
    var sql_params = [req.body.location.lat, req.body.location.lng, distance];
    
    dosql(res, sql_query, sql_params, function (res, data) {
        res.type('application/json');
        res.json({data});
    });
    
}
  
exports.findById = function (req, res) {
    var sql_query = 'SELECT * FROM pois WHERE poi_id = ?';
    var sql_params = [req.params.poi_id];

    dosql(res, sql_query, sql_params, function (res, data) {
        res.type('application/json');
        res.json({data});
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
        res.type('application/json');
        res.json({data});
    });
}

exports.showStateById = function (req, res) {
    var sql_query = 'SELECT poi_id, available FROM pois WHERE poi_id = ?';
    var sql_params = [req.params.poi_id];
    
    dosql(res, sql_query, sql_params, function (res, data) {
        res.type('application/json');
        res.json({data});
    });
}

exports.testlistall = function (req, res) {
    var sql_query = 'SELECT * FROM pois';
    
    dosql(res, sql_query, [], function (res, data) {
        res.type('application/json');
        res.json({data});
    });
}

function dosql (res, sql_query, sql_params_toescape, callback) {
    mysql_pool.getConnection(function (err,connection) {
        if (err) {
            connection.release();
      
            res.statusCode = 500;
            res.send('database connection error');
        }   
  
        //console.log('connected as id ' + connection.threadId);

        connection.query(sql_query, sql_params_toescape, function (err, rows) {
            connection.release();
            if (err) {
                res.statusCode = 400;
                res.send('sql query error');
            } else {
                callback(res, rows);
            }
        });
    });
}