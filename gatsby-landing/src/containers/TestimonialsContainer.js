import React from "react";
import Testimonials from "../components/Testimonials";
import testimonialsData from "../../content/testimonials.json";

const TestimonialsContainer = () => {
  return <Testimonials {...testimonialsData} />;
};

export default TestimonialsContainer;
