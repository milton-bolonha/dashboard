import React from "react";
import { useStaticQuery, graphql } from "gatsby";

function Seo({
  title,
  description,
  lang = "en",
  meta = [],
  isBlogPost = false,
  path,
}) {
  const { site, siteLogo } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
            siteUrl
            keywords
            business {
              name
              address {
                street
                city
                region
                postalCode
                country
              }
              phone
              email
              openingHours
              social {
                facebook
                instagram
              }
              logo
            }
            tracking {
              googleSiteVerification
              gtag
            }
            integrations {
              googleAds
              microsoftAds
            }
          }
        }
        siteLogo: file(relativePath: { eq: "logo.png" }) {
          publicURL
        }
      }
    `
  );

  const metaDescription = description || site.siteMetadata.description;
  const pageTitle = title
    ? `${title} | ${site.siteMetadata.title}`
    : site.siteMetadata.title;
  const canonicalUrl = path
    ? `${site.siteMetadata.siteUrl}${path}`
    : site.siteMetadata.siteUrl;
  const imageUrl = `${site.siteMetadata.siteUrl}${
    siteLogo?.publicURL || site.siteMetadata.business.logo
  }`;

  const { business, tracking, integrations } = site.siteMetadata;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteMetadata.title,
    description: site.siteMetadata.description,
    url: site.siteMetadata.siteUrl,
    inLanguage: lang,
    copyrightYear: new Date().getFullYear(),
    image: imageUrl,
    keywords: site.siteMetadata.keywords.join(", "),
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: site.siteMetadata.siteUrl,
    image: imageUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    telephone: business.phone,
    openingHours: business.openingHours,
    priceRange: "$$$",
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.name,
    url: site.siteMetadata.siteUrl,
    logo: imageUrl,
    sameAs: [business.social.facebook, business.social.instagram].filter(
      Boolean
    ),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: business.phone,
        email: business.email,
        contactType: "customer service",
      },
    ],
  };

  return (
    <>
      <html lang={lang} />
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={site.siteMetadata.keywords.join(", ")} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={isBlogPost ? "article" : "website"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={site.siteMetadata?.author || ""} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {meta.map((m, i) => (
        <meta key={i} {...m} />
      ))}
      <meta
        name="google-site-verification"
        content={tracking.googleSiteVerification}
      />
      <link rel="canonical" href={canonicalUrl} />

      <script type="application/ld+json">
        {JSON.stringify(webSiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {/* --- Scripts de Integração --- */}
      {/* Google Tag Manager / GA4 */}
      {tracking.gtag && (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${tracking.gtag}`}
        ></script>
      )}
      {tracking.gtag && (
        <script id="gtag-config">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${tracking.gtag}');
          `}
        </script>
      )}

      {/* Google Ads */}
      {integrations.googleAds && (
        <script id="google-ads-config">
          {`
            gtag('config', '${integrations.googleAds}');
          `}
        </script>
      )}

      {/* Microsoft Ads (UET Tag) */}
      {integrations.microsoftAds && (
        <script id="microsoft-ads-config">
          {`
            (function(w,d,t,r,u)
            {
                var f,n,i;
                w[u]=w[u]||[],f=function()
                {
                    var o={ti:"${integrations.microsoftAds}", enableAutoSpaTracking: true};
                    o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")
                },
                n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function()
                {
                    var s=this.readyState;
                    s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)
                },
                i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)
            })
            (window,document,"script","//bat.bing.com/bat.js","uetq");
          `}
        </script>
      )}
    </>
  );
}

export default Seo;
