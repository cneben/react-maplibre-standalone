/** @jsxImportSource @emotion/react */
import { useRef, useEffect, useState } from "react";
import maplibregl, {MapEventType} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { StyleSpecification, SourceSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<StyleSpecification | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lat] = useState(45.92);
  const [lng] = useState(6.87);
  const [zoom] = useState(14);

  useEffect(() => {
    if (style !== null) return;
    const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const styleUrl = `${baseUrl}style.json`;
    console.error("baseUrl=" + baseUrl);
    console.error("styleUrl=" + styleUrl);

    // Note 20240714: Manually modify base url for ressources loaded
    // in style.json to fit the current Vite.js deployment.
    async function initStyle(url: string) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch style JSON: ${response.statusText}`);
      }
      let refStyle = (await response.json()) as StyleSpecification;
      if (refStyle && refStyle.sources) {
        Object.values(refStyle.sources).forEach(
          (source: SourceSpecification) => {
            let tiles = (source as VectorSourceSpecification).tiles;
            if (tiles) {
                (source as VectorSourceSpecification).tiles = tiles.map<string>((tile) : string => {
                return tile.replace("{baseUrl}", baseUrl);
              });
            }
          }
        );
      }
      if (refStyle && refStyle.sprite) {
        // @ts-expect-error
        refStyle.sprite = refStyle.sprite.replace("{baseUrl}", baseUrl);
      }
      if (refStyle.glyphs) {
        refStyle.glyphs = refStyle.glyphs.replace("{baseUrl}", baseUrl);
      }
      console.error('refStyle=' + JSON.stringify(refStyle, null, 2))
      setStyle(refStyle);
    }

    initStyle(styleUrl);
  });

  useEffect(() => {
    if (map.current) return;
    if (!style) return;

    let maplibreMap = new maplibregl.Map({
      container: mapContainer.current as HTMLElement,
      style: style,
      center: [lng, lat],
      zoom: zoom,
      antialias: true,
      maxPitch: 80,
      maplibreLogo: true,
      maxBounds: [6.54, 45.77, 7.16, 46.04],
    });
    map.current = maplibreMap

    maplibreMap.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true,
      }),
      "top-right"
    );
    maplibreMap.addControl(
      new maplibregl.TerrainControl({
        source: "terrain_source",
        exaggeration: 1,
      })
    );
    maplibreMap.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 300,
        unit: "metric",
      })
    );

    // 'building' layer in the openmaptiles vector source contains building-height
    // data from OpenStreetMap.
    // FIXME: Add a hillshade layer for hillshade_source
    maplibreMap.on(
      // @ts-expect-error
      "load",
      () => {
        console.error("!!!!!!!MAP on load...");
        map.current!.addLayer(
          {
            id: "building-3d",
            source: "openmaptiles",
            "source-layer": "building",
            filter: ["all", ["!has", "hide_3d"]],
            type: "fill-extrusion",
            minzoom: 13,
            layout: { visibility: "visible" },
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": {
                property: "render_height",
                type: "identity",
              },
              "fill-extrusion-base": {
                property: "min_height",
                type: "identity",
              },
              "fill-extrusion-opacity": 0.6,
            },
          },
          "waterway-name"
        );

        map.current!.setSky({
          "sky-color": "#008dff",
          "sky-horizon-blend": 0.6,
          "horizon-color": "#88c6f9",
          "horizon-fog-blend": 0.7,
          "fog-color": "#c6c6c6",
          "fog-ground-blend": 0.5,
        });
      },
      [style]
    );
  });

  return (
    <div
      css={{
        position: "relative",
        width: "100%",
        height: "100vh",
      }}
    >
      <div
        ref={mapContainer}
        css={{
          position: "absolute",
          width: "100%",
          height: "100vh",
          backgroundColor: "#c0ddfd",
        }}
      />
    </div>
  );
};

export default Map;
