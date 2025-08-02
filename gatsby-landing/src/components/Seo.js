import React from "react";
import { Script } from "gatsby";

function generateNavigationSchema(items, baseUrl) {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.label,
    item: `${baseUrl}${item.link}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: itemListElement,
  };
}

function parseOpeningHours(hoursString) {
  if (!hoursString || !hoursString.includes(" ")) return [];
  // Exemplo: "Mo-Fr 09:00-20:00"
  const parts = hoursString.split(" ");
  if (parts.length < 2) return [];

  const dayRange = parts[0];
  const timeRange = parts[1];

  const [opens, closes] = timeRange.split("-");
  if (!opens || !closes) return [];

  const days = [];
  if (dayRange === "Mo-Fr") {
    days.push("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
  } else if (dayRange === "Mo-Sa") {
    days.push(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    );
  }

  if (days.length === 0) return [];

  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: opens,
      closes: closes,
    },
  ];
}

function Seo({
  site, // Prop com os dados de site.json
  title,
  description,
  lang = "en-CA",
  meta = [],
  isBlogPost = false,
  path,
  image,
  canonicalUrlOverride,
  navigationItems = [],
  services = [],
  noindex = false,
}) {
  // Se os dados do site não forem passados, retorna um fallback mínimo
  if (!site) {
    return (
      <title>{title ? `${title} | Loading...` : "Bubble Wrap Solutions"}</title>
    );
  }

  // Comportamento normal quando os dados são recebidos
  const metaDescription = description || site.description;
  const pageTitle = title ? `${title} | ${site.title}` : site.title;
  const canonicalUrl = canonicalUrlOverride
    ? `${site.siteUrl}${canonicalUrlOverride}`
    : path
    ? `${site.siteUrl}${path}`
    : site.siteUrl;
  const buildDate = new Date().toISOString();

  const defaultImage = site.business.logo;
  const imageUrl = `${site.siteUrl}${image || defaultImage}`;

  const { business, tracking, integrations, keywords } = site;

  const navigationSchema =
    navigationItems.length > 0
      ? generateNavigationSchema(navigationItems, site.siteUrl)
      : null;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.title,
    description: site.description,
    url: site.siteUrl,
    inLanguage: lang,
    copyrightYear: new Date().getFullYear(),
    image: imageUrl,
    keywords: keywords.join(", "),
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: metaDescription,
    url: canonicalUrl,
    inLanguage: lang,
    datePublished: buildDate,
    dateModified: buildDate,
    isPartOf: {
      "@id": `${site.siteUrl}/#website`,
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: site.siteUrl,
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

  const constructionCompanySchema = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: business.name,
    description: site.description,
    image: imageUrl,
    logo: imageUrl,
    url: site.siteUrl,
    telephone: business.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    sameAs: [business.social.facebook, business.social.instagram].filter(
      Boolean
    ),
    potentialAction: {
      "@type": "ReserveAction",
      name: "Get a Free Quote",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.siteUrl}/contact-us#online-quote`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/IOSPlatform",
          "http://schema.org/AndroidPlatform",
        ],
      },
    },
  };

  const openingHoursSpec = parseOpeningHours(business.openingHours);
  if (openingHoursSpec.length > 0) {
    constructionCompanySchema.openingHoursSpecification = openingHoursSpec;
  }

  const serviceItems = services
    .filter((service) => service.description && service.slug)
    .map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        url: `${site.siteUrl}/services#${service.slug}`,
      },
    }));

  if (serviceItems.length > 0) {
    constructionCompanySchema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: serviceItems,
    };
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.name,
    url: site.siteUrl,
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
      <link rel="preload" as="image" href="/images/hero-bg.webp" />
      <title>{pageTitle}</title>
      <meta name="author" content={business.name} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="image" content={imageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={isBlogPost ? "article" : "website"} />
      {isBlogPost && (
        <meta property="article:published_time" content={buildDate} />
      )}
      {isBlogPost && (
        <meta property="article:modified_time" content={buildDate} />
      )}
      <meta property="og:url" content={canonicalUrl + "/"} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={site.author || ""} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {noindex ? (
        <meta name="robots" content="noindex" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      {meta.map((m, i) => (
        <meta key={i} {...m} />
      ))}
      <meta
        name="google-site-verification"
        content={tracking.googleSiteVerification}
      />
      <link rel="canonical" href={canonicalUrl} />

      <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
      <script type="application/ld+json">
        {JSON.stringify(webSiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(constructionCompanySchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {navigationSchema && (
        <script type="application/ld+json">
          {JSON.stringify(navigationSchema)}
        </script>
      )}

      {tracking.gtag && (
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${tracking.gtag}`}
          strategy="off-main-thread"
        />
      )}
      {tracking.gtag && (
        <Script id="gtag-config" strategy="off-main-thread">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${tracking.gtag}');
          `}
        </Script>
      )}

      {integrations.googleAds && (
        <Script id="google-ads-config" strategy="off-main-thread">
          {`
            gtag('config', '${integrations.googleAds}');
          `}
        </Script>
      )}

      {integrations.microsoftAds && (
        <Script id="microsoft-ads-config" strategy="off-main-thread">
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
        </Script>
      )}
    </>
  );
}

export default Seo;
