import React from "react";
import Testimonials from "../components/Testimonials";

const TestimonialsBuilderContainer = (props) => {
  // Este componente agora espera receber tanto o `title` quanto os `testimonials` via props.
  const { title, testimonials } = props;

  if (!testimonials) {
    return null; // Não renderiza nada se não houver testimonials
  }

  const finalData = {
    title: title,
    testimonials: testimonials,
  };

  return <Testimonials {...finalData} />;
};

export default TestimonialsBuilderContainer;
