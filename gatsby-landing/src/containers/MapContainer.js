import React from "react";
import Map from "../components/Map";

const MapContainer = (props) => {
  // A prop 'map' vem do frontmatter, que contém 'src' e 'title'
  const { map } = props;

  if (!map || !map.src) {
    return null;
  }

  return <Map src={map.src} title={map.title} />;
};

export default MapContainer;
