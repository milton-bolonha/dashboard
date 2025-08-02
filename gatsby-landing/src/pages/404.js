import React from "react";
import { Link } from "gatsby";
import LayoutContainer from "../containers/LayoutContainer";
import Seo from "../components/Seo";

const NotFoundPage = () => {
  // Passamos `globalData` como um objeto vazio para o LayoutContainer.
  // Ele é robusto o suficiente para renderizar o header/footer básicos sem dados.
  return (
    <LayoutContainer globalData={{}}>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-lg mb-8">
          Sorry, we couldn’t find what you were looking for.
        </p>
        <Link to="/" className="text-blue-500 hover:underline">
          Go back to the homepage
        </Link>
      </div>
    </LayoutContainer>
  );
};

export default NotFoundPage;

export const Head = ({ location }) => (
  // O SEO para a página 404 pode ter dados estáticos ou mínimos.
  <Seo
    title="404: Not Found"
    description="The page you were looking for could not be found."
    path={location.pathname}
  />
);
