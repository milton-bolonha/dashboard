import React from "react";
import Layout from "../components/Layout";

import headerData from "../../content/header.json";
import topbarData from "../../content/topbar.json";

const LayoutContainer = ({ children, bgImage, pageTitle }) => {
  // A TopBar só será renderizada se o arquivo de dados tiver conteúdo
  const showTopBar =
    topbarData &&
    (topbarData.content?.data?.texto || topbarData.marquee?.data?.texto);

  return (
    <Layout
      showTopBar={showTopBar}
      topbarData={topbarData}
      headerData={headerData}
      bgImage={bgImage}
      pageTitle={pageTitle}
    >
      {children}
    </Layout>
  );
};

export default LayoutContainer;
