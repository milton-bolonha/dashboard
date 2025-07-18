import React from "react";
import { Link } from "gatsby";
import LayoutContainer from "../containers/LayoutContainer";
import Seo from "../components/Seo";

// Importar dados do site para SEO
import siteData from "../../content/site.json";
import headerData from "../../content/header.json";
import servicesData from "../../content/services.json";

const NotFoundPage = () => {
  return (
    <LayoutContainer>
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
  <Seo
    site={siteData}
    title="404: Not Found"
    path={location.pathname}
    navigationItems={headerData.menu.data.items}
    services={servicesData.services}
  />
);
