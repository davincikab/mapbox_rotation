class CustomGeolocation extends mapboxgl.Evented {
    constructor(options, map) {
        super();

        this._map = map;
        this.options = {
            positionOptions: {
                enableHighAccuracy: true
            },
            fitBoundsOptions:{
                maxZoom:15
            },
            showAccuracyCircle:false,
            trackUserLocation: true,
            showUserHeading: true,
            geolocation:navigator.geolocation
        };

        this.options = {...this.options, ...options};

        if(this.options.trackUserLocation) {
            // run watch position
            let options = {
                ...this.options.positionOptions,
                enableHighAccuracy:true,
            };

            // this._geolocationWatchID = this.options.geolocation.watchPosition((pos) => this.onSuccess(pos), (err) => this.onError(err), options);
        } else {
            // run wactch position
            let options = {
                ...this.options.positionOptions,
                enableHighAccuracy:true,
            };

            // this.options.geolocation.getCurrentPosition((pos) => this.onSuccess(pos), (err) => this.onError(err), options);
            this._timeoutId = setTimeout(this._geolocate_finish, 10000 /* 10sec */);
        }


        this._dotElement = DOM.create('div', 'mapboxgl-user-location mapboxgl-user-location-show-heading');
        this._dotElement.appendChild(DOM.create('div', 'mapboxgl-user-location-dot'));
        this._dotElement.appendChild(DOM.create('div', 'mapboxgl-user-location-heading'));

        this._userLocationDotMarker = new mapboxgl.Marker({
            element: this._dotElement,
            rotationAlignment: 'map',
            pitchAlignment: 'map'
        });

        this.onSuccess.bind(this);

        this.geolocationBtn = document.getElementById("gps-button");
        this.geolocationBtn.onclick = evt => {
            console.log(evt);
            this.triggerGeolocation();
        };


        if(this.options.showUserHeading) {
            this.addDeviceOrientationListener();
        }
    }


    addDeviceOrientationListener() {

        const addListener = () => { 
            console.log("addListener");
            if ('ondeviceorientationabsolute' in window) {
                // $FlowFixMe[method-unbinding]
                window.addEventListener('deviceorientationabsolute', (e) => this._onDeviceOrientation(e), false);
            } else {
                // $FlowFixMe[method-unbinding]
                window.alert("Orientation Listener");
                window.addEventListener('deviceorientation', (e) => this._onDeviceOrientation(e), false);
            }
        };

        if (typeof window.DeviceMotionEvent !== "undefined" &&
            typeof window.DeviceMotionEvent.requestPermission === 'function') {
            // $FlowFixMe
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        addListener();
                    }
                })
                .catch(console.error);
        } else {
            addListener();
        }
    }

    _onDeviceOrientation(deviceOrientationEvent) {
        // alert("Device Orientation");
        console.log(this);
        if (this._userLocationDotMarker) {
            

            if (deviceOrientationEvent.webkitCompassHeading) {
                // Safari
                this._heading = deviceOrientationEvent.webkitCompassHeading;
            } else if (deviceOrientationEvent.absolute === true) {
                // non-Safari alpha increases counter clockwise around the z axis
                this._heading = deviceOrientationEvent.alpha * -1;
            }

            console.log("Device orientation");
            document.getElementById("heading").innerHTML = `Heading Map: ${this._heading};`;
            this.updateMarkerRotation();
        } else {
            console.log("Marker Not Found");
        }
    }

    updateMarkerRotation() {
        if (this._userLocationDotMarker && typeof this._heading === 'number') {
            this._userLocationDotMarker.setRotation(this._heading);
            this._dotElement.classList.add('mapboxgl-user-location-show-heading');

            // document.getElementById("heading").innerHTML = `Heading Map: ${this._heading};`;
        } else {
            this._dotElement.classList.remove('mapboxgl-user-location-show-heading');
            this._userLocationDotMarker.setRotation(0);
        }
    }


    updateMarker(position) {
        if (position) {
            const center = new mapboxgl.LngLat(position.coords.longitude, position.coords.latitude);
            // this._accuracyCircleMarker.setLngLat(center).addTo(this._map);

            this._userLocationDotMarker.setLngLat(center).addTo(this._map);
        } else {
            this._userLocationDotMarker.remove();
        }
    }

    updateDirections() {

    }

    triggerGeolocation() {

        if(this._geolocationWatchID) {
            console.log("Clear Watch");
            this._clearWatch();

            this._userLocationDotMarker.remove();

            this.geolocationBtn.classList.remove("active");
            this.geolocationBtn.innerHTML = "GPS OFF";

        } else if(!this.options.trackUserLocation && !this._geolocationWatchID) {
            // console.log("Watch Location");

            this.options.geolocation.getCurrentPosition(
                (pos) => this.onSuccess(pos), 
                (err) => this.onError(err), 
                this.options.positionOptions
            );

            // This timeout ensures that we still call finish() even if
            // the user declines to share their location in Firefox
            // $FlowFixMe[method-unbinding]
            this._timeoutId = setTimeout(this._geolocate_finish(), 10000 /* 10sec */)

            this.geolocationBtn.classList.add('active');
            this.geolocationBtn.innerHTML = 'GPS ON';
        }  else {
            console.log("Watch Location")
            this._geolocationWatchID = this.options.geolocation.watchPosition(
                (pos) => this.onSuccess(pos), 
                (err) => this.onError(err), 
                this.options.positionOptions
            );

            if (this.options.showUserHeading) {
                this.addDeviceOrientationListener();
            }

            this.geolocationBtn.classList.add('active');
            this.geolocationBtn.innerHTML = 'GPS ON';
        }
    }

    onSuccess(position) {
        if (!this._map) {
            return;
        }

        if (this.options.trackUserLocation) {
            this._lastKnownPosition = position;
        }

        // if (this.options.showUserLocation) {

        // }

        this.position = position;
        this.updateMarker(position);
    
        console.log(position);
        // // dispatchEvent(new Event('geolocate', position))
        // this.fire('geolocate_success', position);
        let event = new CustomEvent("geolocate_success", { detail : { position: position } }); // (2)
        this.geolocationBtn.dispatchEvent(event);

        // this._map.fire('location_success', position)
        this.updateDirections(position);
        this._geolocate_finish();
    }


    onError(error){ 
        // alert(error.message);

        document.getElementById("gps-button").classList.remove('active');

        this.fire('geolocate_error', error);
        this._geolocate_finish();
    }

    _clearWatch() {
        this.options.geolocation.clearWatch(this._geolocationWatchID);
        this._geolocationWatchID = undefined;
    }
    
    _geolocate_finish() {
        if (this._timeoutId) { 
            clearTimeout(this._timeoutId); 
        }

        this._timeoutId = undefined;
    }


}

const DOM = {
    create:function(element, className) {
        let htmlElement = document.createElement(element);
        htmlElement.className = className;

        return htmlElement;
    }
}