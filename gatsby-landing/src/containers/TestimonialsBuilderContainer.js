import React from "react";
import Testimonials from "../components/Testimonials";
import testimonialsData from "../../content/testimonials.json";

const TestimonialsBuilderContainer = (props) => {
  const { title } = props;
  const { testimonials } = testimonialsData;

  // Use the title from page_builder, but the testimonials from the JSON
  const finalData = {
    title: title,
    testimonials: testimonials,
  };

  return <Testimonials {...finalData} />;
};

export default TestimonialsBuilderContainer;
