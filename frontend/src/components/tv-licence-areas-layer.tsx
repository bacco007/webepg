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
      style: () => ({
        fillColor: "#3388ff",
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.2,
      }),
      onEachFeature: (feature, layer) => {
        const areaName = feature.properties?.NAME as string;
        layer.on({
          mouseover: (e) => {
            const targetLayer = e.target as L.GeoJSON;
            targetLayer.setStyle({
              fillColor: "#ff7800",
              weight: 5,
              color: "#666",
              dashArray: "",
              fillOpacity: 0.4,
            });
            targetLayer.bringToFront();
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
          },
          click: () => {
            onSelectArea(areaName);
            if (layer instanceof L.Polygon) {
              map.fitBounds(layer.getBounds());
            }
          },
        });
        layer.bindTooltip(areaName, { permanent: false, direction: "center" });
      },
    }).addTo(map);

    return () => {
      map.removeLayer(geoJsonLayer);
    };
  }, [geoJsonData, map, onSelectArea]);

  return null;
}
