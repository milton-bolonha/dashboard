import React from "react";
import Boxes from "../components/Boxes";

const BoxesContainer = (props) => {
  // Repassa todas as props, incluindo a nova 'isAlternate'
  if (!props.boxes || props.boxes.length === 0) {
    return null;
  }
  return <Boxes {...props} />;
};

export default BoxesContainer;
