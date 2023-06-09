mapboxgl.accessToken = 'pk.eyJ1IjoiZGFobGsiLCJhIjoiY2xoNjllazR5MDJmNzNybzZ2cHZtc3pvaSJ9.tLB2WDqOgw8RiLPbrm6TYg';
let osmStyle = {
    'version': 8,
    'glyphs': "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    'sources': {
        'raster-tiles': {
            'type': 'raster',
            'tiles': [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            'tileSize': 256,
            'attribution':'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    'layers': [
        {
            'id': 'simple-tiles',
            'type': 'raster',
            'source': 'raster-tiles',
            'minzoom': 0,
            'maxzoom': 22
        }
    ]
};

const map = new mapboxgl.Map({
    container: 'map',
    style: osmStyle,
    center: [10.745571, 54.035289], // Berlin, Germany
    projection:'mercator',
    zoom: 15
});

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// GPS Geolocation
const customGeo = new CustomGeolocation({
    positionOptions: {
        enableHighAccuracy: true
    },
    fitBoundsOptions:{
        maxZoom:15
    },
    showUserLocation:false,
    showAccuracyCircle:false,
    trackUserLocation: true,
    showUserHeading: true
}, map);


let isZoomedIn = false;
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
let userLocation, directions;

map.on('load', () => {
    customGeo.triggerGeolocation(); 

    map.on("click", (e) => {
        console.log(e);

        let coords = Object.values(e.lngLat);
        customDirections.setDestination(coords);
        customDirections.findRoute();
    });

    // add the images
    map.addSource('portland', {
        "type": "image",
        'url': './image_updated.PNG',
        "coordinates": [
            [ 10.742511794243363, 54.034344686385751],
            
            [ 10.750258147451364, 54.034344686385751],
           
            [ 10.750258147451364, 54.036384906215751],
            [ 10.742511794243363, 54.036384906215751]
        ]
    });

    // map.addSource('portland', {
    //     "type": "raster",
    //     'url': './Scharbeutz.jpg'
    // });
         
    // map.addLayer({
    //     'id': 'portland',
    //     'source': 'portland',
    //     'type': 'raster',
    //     'paint':{
    //         'raster-opacity':0.9
    //     }
    // });

    // add osm data
    map.addSource('directions-src', {
        type:'geojson',
        data:{"type":"FeatureCollection", "features":[]}
    });

    map.addLayer({
        id:'direction-line-casing',
        source:'directions-src',
        type:'line',
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color': '#2d5f99',
            'line-width': [
                "interpolate",
                ["exponential", 1.5],
                ["zoom"],
                3,
                5,
                15,
                15
            ]
          },
          'filter': [
            'all',
            ['in', '$type', 'LineString'],
            ['in', 'route', 'selected']
        ]
    });

    map.addLayer({
        id:'direction-line',
        source:'directions-src',
        type:'line',
        paint:{
            'line-color':'#4882c5',
            'line-width':[
                "interpolate",
                ["exponential", 1.5],
                ["zoom"],
                3,
                3.5,
                15,
                10
            ]
        },
        'filter': [
            'all',
            ['in', '$type', 'LineString'],
            ['in', 'route', 'selected']
        ]
    });

    map.addLayer({
        'id': 'directions-waypoint-point',
        'type': 'circle',
        'source': 'directions-src',
        'paint': {
          'circle-radius': 18,
          'circle-color':[
            'match',
            ['get', 'marker-symbol'],
            'A',
            '#8a8bc9',
            '#31a1b2'
          ] 
        },
        'filter': [
          'all',
          ['in', '$type', 'Point'],
          ['in', 'id', 'waypoint']
        ]
    });

    map.addLayer({
        'id': 'directions-point-label',
        'type': 'symbol',
        'source': 'directions-src',
        'layout': {
          'text-field': ['get', 'marker-symbol'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        'paint': {
          'text-color': '#fff'
        },
        'filter': [
          'all',
          ['in', '$type', 'Point'],
        ]
    });

    map.on('rotate', () => {
        // console.log('A rotate event occurred.');
    });

    // Mapbox Directions
    directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        controls: {
            profileSwitcher:false,
            inputs: false,
            instructions: false,
        },
        trackUserLocation:true,
        interactive: false
        // language: 'de'
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
        const targetKey = Object.keys(coordinates).find(key => {
            return key.toLocaleLowerCase() === id
        });

        // console.log(targetCoord);
        if (targetKey) {
            const destination = [...coordinates[targetKey]];

            // updateRoute(destination);          
            customDirections.setDestination(destination);
            customDirections.findRoute();
        }
    });

    // customGeo.on('trackuserlocationstart', (position) => {
    //     console.log(position);
    // });

    customGeo.geolocationBtn.addEventListener("geolocate_success", function(event) {
        console.log("Custom Event");
        console.log(event.detail.position);
        // return;
        let position = event.detail.position;

        let center = [position.coords.longitude, position.coords.latitude];
        if(!isZoomedIn) {
            map.flyTo({
                center,
                zoom:15
            });

            isZoomedIn = true;
        }

        userLocation = [...center];

        // document.getElementById("heading").innerHTML = `Head: ${Math.round(Math.random()*10)}`
        customDirections.setOrigin(userLocation);
        customDirections.findRoute();
    });

    // toggle map style
    const layerList = document.getElementById('menu');
    const inputs = layerList.querySelectorAll('input');

    for (const input of inputs) {
        input.onclick = (layer) => {
            const layerId = layer.target.id;

            
            let directionSources = map.getStyle().sources['directions-src'];
            let layers = map.getStyle().layers.filter(layer => layer.source == 'directions-src');

            if(layerId == "osm") {
                map.setStyle(osmStyle);
            } else {
                map.setStyle('mapbox://styles/mapbox/' + layerId);
            }
            

            map.once('styledata', (e) => {
                map.addSource('directions-src', directionSources);
                layers.forEach(layer => map.addLayer(layer));
            })
           

            // switchBasemap(map, layerId);
        };
    }
});

customGeo.on('geolocate_error', (error) => {
    console.error('GeolocateControl error:', error);
});

document.getElementById("toggle-btn").onclick = (e) => {
    document.querySelector(".mapboxgl-ctrl-directions").classList.toggle('d-none');
    // document.querySelector(".custom-directions").classList.toggle('d-block');

    // document.querySelector(".directions-tab").classList.toggle('d-block');
}


// window.addEventListener("deviceorientation", handleOrientation, true);
const easing = t => t * (1 - t)
let count = 0;
// if (window.DeviceOrientationEvent) {
//     window.addEventListener('deviceorientation',handleOrientation, false);
//     alert("Firing Device Orientatation");
// } else {
//     alert("Sorry, your browser doesn't support Device Orientation")
// }

function handleOrientation(event) {
    let compassdir;
    count++;

    if (event.webkitCompassHeading) {
        // Apple works only with this, alpha doesn't work
        // alert("Iphone");
        compassdir = event.webkitCompassHeading
    }
    else {
        compassdir = event.alpha * -1;
    }

    // document.getElementById("heading").innerHTML = "<small>Count: " + count + "</small>";

    if(map.isZooming() || map.isMoving()) {
        return;
    }

    if(Math.abs(geolocate._heading) - Math.abs(map.getBearing()) < 1 ) {
        return;
    }

    let bearing = compassdir || geolocate._heading;
    // document.getElementById("heading").innerHTML = bearing;
    setTimeout((e) => {
        // map.rotateTo(bearing, {
        //     duration:100
        // });

        // map.easeTo({
        //     bearing,
        //     duruation:100,
        // })

    }, 100);
}
var _i = null;
var _e = null;
var _c = 0;

function testOrientationSupport() {
    let isIphone = iOS();
    // document.getElementById("heading").innerHTML = navigator.platform || navigator.userAgentData.platform;

    if(isIphone) {
        requestOrientationPermission();
        return;
    }

    var updateDegree = function(e){
        _e = e;

        if(_e !== null && _e.alpha !== null) { 
            handleOrientation(_e);
        }
        
    }

    window.addEventListener('deviceorientation', updateDegree, false);
}

// testOrientationSupport();


// check if the device is Ios
function requestOrientationPermission(){

    // alert("Requesting Permission");

    if ( typeof( DeviceOrientationEvent ) !== "undefined" && typeof( DeviceOrientationEvent.requestPermission ) === "function" ) {
        DeviceOrientationEvent.requestPermission()
        .then(response => {
            if (response == 'granted') {
                window.addEventListener('deviceorientation', (e) => {
                    // do something with e
                    handleOrientation(e);
                })
            }
        })
        .catch(error => {
            console.error(error);

            alert("Permission Denied");
        })
    } else {
        alert("Device Orietation Not Supported: Rotate the map Manually");
    }
}

function iOS() {
    let platform = navigator.platform || navigator.userAgentData.platform;

    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

// mapbox geolocation
// document.getElementById("gps-button").onclick = (e) => {
//     console.log(e);

//     if(e.target.classList.contains('active')){
//         // geolocate._clearWatch();
//         customGeo._watchState = 'BACKGROUND_ERROR';
//         customGeo.trigger();

//         e.target.classList.remove('active');
//         e.target.innerHTML = "GPS OFF";
//     } else {
//         customGeo.trigger();
//         e.target.classList.add('active');
//         e.target.innerHTML = "GPS ON";
//     }   
// }

class CustomDirections {
    constructor() {
        this.destination;
        this.origin;
        this.isInitialCall = true;
        this.profile = "car";

        this.originGeocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            zoom: 4,
            placeholder: 'Try: -40, 170',
            mapboxgl: mapboxgl,
            reverseGeocode: true
        });

        this.destinationGeocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            zoom: 4,
            placeholder: 'Try: -40, 170',
            mapboxgl: mapboxgl,
            reverseGeocode: true
        });
    }

    init() {
        document.getElementById('geocoder-origin').appendChild(this.destinationGeocoder.onAdd(map));
        document.getElementById('geocoder-destination').appendChild(this.originGeocoder.onAdd(map));

        this.destinationGeocoder.on("result", (result) => {
            console.log(result);
            this.destination = result;
            this.findRoute();
        });

        this.originGeocoder.on("result", (result) => {
            console.log(result);
            this.origin = result;
            this.findRoute();
        });

        this.activeProfile = document.querySelector("label.active");

        let togglers = document.querySelectorAll(".profile-switcher input");
        console.log(togglers);
        togglers.forEach(input => {
            input.onclick = (e) => {
                console.log(e);

                let { dataset, id } = e.target;
                console.log(dataset);

                if(!this.activeProfile.id.includes(id)) {
                    let element = document.getElementById(`label-${id}`);

                    element.classList.add('active');

                    this.activeProfile.classList.remove("active");

                    this.activeProfile  = element;
                    this.profile = dataset.profile;

                    this.findRoute();
                }
            }

        });

    }

    // update origin
    setOrigin(coord) {
        this.origin = {
            "lon":coord[0],
            "lat":coord[1],
            "type":"break"
        }

        // this.origin ={
        //     lon:10.745571, 
        //     lat:54.035289,
        //     type:"break",
        // }
    }

    setDestination(coord) {
        this.destination = {
            "lon":coord[0],
            "lat":coord[1],
            "type":"break"
        }
    }


    renderInstructions(legs, locations) {
        console.log(legs);

        let { maneuvers, shape } = legs[0];
        console.log(maneuvers);

        let legItems     = maneuvers.map(item => {
            let iconClass = this.getDirectionIconClass(item.instruction);
            return `
                <li data-lat="-0.248315" data-lng="37.639128" class="mapbox-directions-step">
                    <span class="directions-icon ${iconClass}"></span>
                    <div class="mapbox-directions-step-maneuver">
                        ${item.instruction}
                    </div>
                    
                    <div class="mapbox-directions-step-distance">
                        ${item.length}km
                    </div>
                </li>
            `;
        });

        document.querySelector("ol").innerHTML = legItems.join("");
        // document.querySelector(".directions-tab").classList.add('d-block');

        // update the route
        let coordinates = decode(shape).map(coord => coord.reverse());
        let lineFeature = {
            "type":"Feature", 
            "geometry":{ 
                "type": "LineString",
                "coordinates":[...coordinates]
            },
            "properties":{
                'route-index': 1,
                'route':'selected'
            }
        };

        let wayPoints = locations.map((location,i) => {
            return this.createPoint([location.lon, location.lat], { 
                id:'waypoint',
                'marker-symbol': i == 0 ? 'A' : 'B'
            })
        });

        console.log(wayPoints);
        let fc = {"type": "FeatureCollection", "features":[lineFeature, ...wayPoints]};
        map.getSource("directions-src").setData(fc);
        console.log(lineFeature);

        let bbox = turf.bbox(lineFeature);

        if(this.isInitialCall) {
            // document.getElementById("heading").innerHTML = "Heading: " + Math.random();
            this.isInitialCall = false;
            map.fitBounds(bbox, { padding:80 });
        }
        
       
    }   

    getDirectionIconClass(instruction) {
        if(instruction.includes("Turn right")) {
            return "directions-icon-right";
        } else if(instruction.includes("Turn left")) {
            return "directions-icon-left";
        } else if(instruction.includes("Bear right")) {
            return "directions-icon-slight-right";
        }  else if(instruction.includes("sharp right")) {
            return "directions-icon-sharp-right";
        }  else if(instruction.includes("Bear left")) {
            return "directions-icon-slight-left";
        } else if(instruction.includes("sharp left")) {
            return "directions-icon-sharp-left";
        } else if(instruction.includes("destination")) {
            return "directions-icon-arrive";
        } else if(instruction.includes("Drive") || instruction.includes("Walk")){
            return "directions-icon-depart";
        } else {
            return "directions-icon-straight";
        }
    }


    renderUpdateSummary(summary) {
        let distance =summary.length;
        let time = this.formatTime(summary.time);

        document.querySelector(".directions-summary").innerHTML = ` <h1>${Math.round(distance)}km</h1><span>${time}</span>`
    }

    formatTime(time) {
        let min, hrs, secs;

        hrs = Math.round(time/3600);
        min = Math.round(time % 60)

        return `${hrs}h ${min}min`
    }

    updateRoute() {

    }

    // swap
    selectProfile(profile) {
        this.profile = profile;
    } 

    findRoute() {
        if(this.destination && this.origin) {
            this.getRoute();
        }
    }

    swapCoordinates() {

    }

    getRoute() {
        let url = `https://valhalla1.openstreetmap.de`;
        let valhallaRequest = this.buildDirectionsRequest();
        console.log(valhallaRequest);

        const config = {
            method:'GET',
            headers: {
              'Content-Type': 'application/json',
            },
        };

        let params = JSON.stringify(valhallaRequest.json);

        fetch(`${url}/route?json=${params}`, config)
        .then(res => res.json())
        .then(data => {
            // data.decodedGeometry = parseDirectionsGeometry(data)
            // dispatch(registerRouteResponse(VALHALLA_OSM_URL, data))
            // dispatch(zoomTo(data.decodedGeometry))
            let { trip : { summary, locations, legs} } = data;

            this.renderInstructions(legs, locations);
            this.renderUpdateSummary(summary)
        })
        .catch(console.error)
    }

    zoomToRoute(route) {

    }

    buildDirectionsRequest() {
        // auto/ pedestrian
        let valhalla_profile = this.profile
        if (this.profile === 'car') {
            valhalla_profile = 'auto'
        }

        return {
            json: {
                "costing":valhalla_profile,
                "exclude_polygons":[],
                "locations":[
                    {...this.origin},
                    {...this.destination}
                ],
                "directions_options":{
                    "units":"kilometers"
                },
                "language":"de",
                "id":"valhalla_directions"
            }
        }
    }

    createPoint(coordinates, properties) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          properties: properties ? properties : {}
        };
    }
}


const customDirections = new CustomDirections();
customDirections.init();

// decode coordinates
const decode = (str, precision) => {
    let index = 0
    let lat = 0
    let lng = 0
    const coordinates = []
    let shift = 0
    let result = 0
    let byte = null
    let latitude_change
    let longitude_change
  
    const factor = Math.pow(10, precision || 6)
  
    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {
      // Reset shift, result, and byte
      byte = null
      shift = 0
      result = 0
  
      do {
        byte = str.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
  
      latitude_change = result & 1 ? ~(result >> 1) : result >> 1
  
      shift = result = 0
  
      do {
        byte = str.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
  
      longitude_change = result & 1 ? ~(result >> 1) : result >> 1
  
      lat += latitude_change
      lng += longitude_change
  
      coordinates.push([lat / factor, lng / factor])
    }
  
    return coordinates
}