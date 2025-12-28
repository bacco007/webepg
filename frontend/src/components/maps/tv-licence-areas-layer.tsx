import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface GeoJSONFeature {
  type: "Feature";
  properties: {
    NAME: string;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][];
  };
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface TVLicenceAreasLayerProps {
  geoJsonData: GeoJSONData | null;
  onSelectArea: (areaName: string) => void;
}

export default function TVLicenceAreasLayer({
  geoJsonData,
  onSelectArea,
}: TVLicenceAreasLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonData) {
      return;
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      onEachFeature: (feature, layer) => {
        const areaName = feature.properties?.NAME as string;
        layer.on({
          click: () => {
            onSelectArea(areaName);
            if (layer instanceof L.Polygon) {
              map.fitBounds(layer.getBounds());
            }
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
          },
          mouseover: (e) => {
            const targetLayer = e.target as L.GeoJSON;
            targetLayer.setStyle({
              color: "#666",
              dashArray: "",
              fillColor: "#ff7800",
              fillOpacity: 0.4,
              weight: 5,
            });
            targetLayer.bringToFront();
          },
        });
        layer.bindTooltip(areaName, { direction: "center", permanent: false });
      },
      style: () => ({
        color: "white",
        dashArray: "3",
        fillColor: "#3388ff",
        fillOpacity: 0.2,
        opacity: 1,
        weight: 2,
      }),
    }).addTo(map);

    return () => {
      map.removeLayer(geoJsonLayer);
    };
  }, [geoJsonData, map, onSelectArea]);

  return null;
}
