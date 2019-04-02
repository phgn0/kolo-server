var map;
var geocoder;

function init(){
    initMap();
    
}

function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 10
    });
    
}

function interpretSearch() {
    var city = document.getElementById('search').elements['city'].value
    //document.getElementById("demo").innerHTML = city;
    //window.alert(city.elements["city"].value)
    
    codeAddress(city)
}

function codeAddress(address) {
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
        map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
}