
function insert_point() {
    var name = document.getElementById('point').elements['point_name'].value;
    var loc_x = document.getElementById('point').elements['point_loc_x'].value;
    var loc_y = document.getElementById('point').elements['point_loc_y'].value;
    
    document.getElementById('output').innerHTML = givesql(name, loc_x, loc_y);
}

function givesql(name, x, y){
    return "INSERT INTO `pois`(`name`, `geo_lat`, `geo_lng`, `available`) VALUES ('" + name + "'," + x + "," + y + ",1);";
}

function insert_interval() {
    var cache = "";
    var it_x = document.getElementById('interval').elements['iterationsx'].value;
    var it_y = document.getElementById('interval').elements['iterationsy'].value;
    var x = document.getElementById('interval').elements['offset_loc_x'].value;
    var y = document.getElementById('interval').elements['offset_loc_y'].value;
    
    var name = document.getElementById('point').elements['point_name'].value;
    var loc_x = document.getElementById('point').elements['point_loc_x'].value;
    var loc_y = document.getElementById('point').elements['point_loc_y'].value;
    
    for (var i_x = 0; i_x < it_x; i_x++) {
        for (var i_y = 0; i_y < it_y; i_y++){
            var num_x = Number(loc_x) + i_x * Number(x);
            var num_y = Number(loc_y) + i_y *Number(y);
            
             cache += givesql(name + i_x + '/' + i_y, num_x.toFixed(6), num_y.toFixed(6)) + "<br>";
        }
    }
    
    document.getElementById('output').innerHTML = cache;
}