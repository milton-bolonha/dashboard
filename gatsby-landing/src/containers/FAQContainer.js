import React from "react";
import Faq from "../components/Faq";

const FAQContainer = ({ faqs = [], isAlternate = false }) => {
  return <Faq faqs={faqs} isAlternate={isAlternate} />;
};

export default FAQContainer;
