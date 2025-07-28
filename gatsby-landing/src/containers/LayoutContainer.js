import React from "react";
import Layout from "../components/Layout";

// Remover imports de JSON estático
// import headerData from "../../content/header.json";
// import topbarData from "../../content/topbar.json";

const LayoutContainer = ({ children, bgImage, pageTitle, globalData }) => {
  // A TopBar só será renderizada se o arquivo de dados tiver conteúdo
  const {
    topbar: topbarData,
    header: headerData,
    footer,
    cities,
    services,
  } = globalData || {};

  const showTopBar =
    topbarData &&
    (topbarData.content?.data?.texto || topbarData.marquee?.data?.texto);

  return (
    <Layout
      showTopBar={showTopBar}
      topbarData={topbarData}
      headerData={headerData}
      // Passar um objeto único para o FooterContainer
      footerProps={{ footer, cities, services }}
      bgImage={bgImage}
      pageTitle={pageTitle}
    >
      {children}
    </Layout>
  );
};

export default LayoutContainer;
