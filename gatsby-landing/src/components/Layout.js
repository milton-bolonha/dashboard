import React from "react";
import HeaderContainer from "../containers/HeaderContainer";
import FooterContainer from "../containers/FooterContainer";
import TopBarContainer from "../containers/TopBarContainer";

const Layout = ({
  children,
  showTopBar,
  topbarData,
  headerData,
  footerProps,
  bgImage,
  pageTitle,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {showTopBar && <TopBarContainer {...topbarData} />}
      <HeaderContainer {...headerData} />

      {bgImage && (
        <div
          className="relative bg-cover bg-center text-white py-20 px-4"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          {pageTitle && (
            <div className="relative container mx-auto text-center">
              <h1 className="text-4xl font-bold">{pageTitle}</h1>
            </div>
          )}
        </div>
      )}

      <main className="flex-grow">{children}</main>
      <FooterContainer {...footerProps} />
    </div>
  );
};

export default Layout;
