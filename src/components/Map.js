import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';


export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lat] = useState(45.92);
    const [lng] = useState(6.87);
    const [zoom] = useState(14);

    useEffect(() => {
        if (map.current) return;
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `http://localhost:3000/style.json`,
            center: [lng, lat],
            zoom: zoom,
            //antialias: true
        });

        // The 'building' layer in the streets vector source contains building-height
        // data from OpenStreetMap.
        map.current.on('load', function () {
            var layers = map.current.getStyle().layers;
            map.current.addLayer(
                {
                    id: 'building-3d',
                    source: 'openmaptiles',
                    'source-layer': "building",
                    filter: ["all", ["!has", "hide_3d"]],
                    type: 'fill-extrusion',
                    minzoom: 13,
                    layout: { visibility: "visible" },
                    paint: {
                        'fill-extrusion-color': '#aaa',
                        // use an 'interpolate' expression to add a smooth transition effect to the
                        // buildings as the user zooms in
                        "fill-extrusion-height": {
                            "property": "render_height",
                            "type": "identity"
                        },
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }
                },
                'waterway-name'
            );
        });
        
        map.current.addControl(
            new maplibregl.NavigationControl({
                visualizePitch: true,
                showZoom: true,
                showCompass: true
            }), 
            'top-right')
        map.current.addControl(
            new maplibregl.TerrainControl({
                source: 'terrain_source',
                exaggeration: 1
            })
        );
        map.current.addControl(
            new maplibregl.ScaleControl({
                maxWidth: 300,
                unit: 'metric'
            }))
    });

    return (
        <div className="map-wrap">
            <div ref={mapContainer} className="map" />
        </div>
    );
}
