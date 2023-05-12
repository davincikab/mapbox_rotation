mapboxgl.accessToken = 'pk.eyJ1IjoiZGFobGsiLCJhIjoiY2xoNjllazR5MDJmNzNybzZ2cHZtc3pvaSJ9.tLB2WDqOgw8RiLPbrm6TYg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [6.35582, 43.11709], // Berlin, Germany
    projection:'mercator',
    zoom: 15
});

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// GPS Geolocation
const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true,
        // maximumAge:2000,
        // timeout:0
    },
    showAccuracyCircle:false,
    trackUserLocation: true,
    showUserHeading: true
});

map.addControl(geolocate, 'bottom-left');

const coordinates =  [
    {id:"96",lat:43.11754,lng:6.35828},
    {id:"A16",lat:43.1157,lng:6.35924},
    {id:"A31",lat:43.11944,lng:6.35923},
    {id:"A14",lat:43.11673,lng:6.35878}
];

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
let userLocation, directions;

map.on('load', () => {
    geolocate.trigger();

    map.on('rotate', () => {
        // console.log('A rotate event occurred.');
    });

    // Mapbox Directions
    directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        controls: {
            profileSwitcher:true,
            inputs: true,
            instructions: true,
        },
        trackUserLocation:true,
        interactive: true,
        language: 'de'
    });

    map.addControl(directions, 'top-left');

    const updateRoute = (destination) => {

        if(!userLocation) {
            alert("Kindly enable geolocation !");
            return;
        } 

        directions.setOrigin(userLocation);
        directions.setDestination(destination);
    };

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const id = searchInput.value.toLocaleLowerCase();
        const targetCoord = coordinates.find(coord => coord.id.toLocaleLowerCase() === id);

        // console.log(targetCoord);
        if (targetCoord) {
            const destination = [targetCoord.lng, targetCoord.lat];

            updateRoute(destination);          
            
        }
    });

    geolocate.on('geolocate', (position) => {
        console.log(position);
        document.getElementById("gps-button").classList.add('active');

        userLocation = [position.coords.longitude, position.coords.latitude];

        if (!directions.getDestination()) {
            // console.log("Select Destination");
        } else {
            directions.setOrigin(userLocation);
        }

        map.setCenter(userLocation);

    });

    // toggle map style
    const layerList = document.getElementById('menu');
    const inputs = layerList.querySelectorAll('input');

    for (const input of inputs) {
        input.onclick = (layer) => {
            const layerId = layer.target.id;

            
            let directionSources = map.getStyle().sources.directions;
            let layers = map.getStyle().layers.filter(layer => layer.source == 'directions');

            map.setStyle('mapbox://styles/mapbox/' + layerId);

            map.once('styledata', (e) => {
                map.addSource('directions', directionSources);
                layers.forEach(layer => map.addLayer(layer));
            })
           

            // switchBasemap(map, layerId);
        };
    }
});

geolocate.on('error', (error) => {
    document.getElementById("gps-button").classList.remove('active');

    console.error('GeolocateControl error:', error);
});

document.getElementById("toggle-btn").onclick = (e) => {
    document.querySelector(".mapboxgl-ctrl-directions").classList.toggle('d-none');
}


window.addEventListener("deviceorientation", handleOrientation, true);
const easing = t => t * (1 - t)

if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation',handleOrientation)
  }
  else {
    alert("Sorry, your browser doesn't support Device Orientation")
}

function handleOrientation(event) {
    let compassdir;

    if (event.webkitCompassHeading) {
        // Apple works only with this, alpha doesn't work
        compassdir = event.webkitCompassHeading
    }
    else {
        compassdir = event.alpha
    }

    if(map.isZooming() || map.isMoving()) {
        return;
    }

    if(Math.abs(geolocate._heading) - Math.abs(map.getBearing()) < 1 ) {
        return;
    }

    setTimeout((e) => {

        let bearing = geolocate._heading || 0;
        map.rotateTo(bearing, {
            duration:100
        });

    }, 100);
}


// mapbox geolocation
document.getElementById("gps-button").onclick = (e) => {
    console.log(e);

    if(e.target.classList.contains('active')){
        // geolocate._clearWatch();
        geolocate._watchState = 'BACKGROUND_ERROR';
        geolocate.trigger();

        e.target.classList.remove('active');
        e.target.innerHTML = "GPS OFF";
    } else {
        geolocate.trigger();
        e.target.classList.add('active');
        e.target.innerHTML = "GPS ON";
    }

    
}