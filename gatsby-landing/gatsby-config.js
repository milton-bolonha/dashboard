require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    // Este valor pode vir do .env ou ser fixo, já que os dados de site vêm da API
    siteUrl: process.env.GATSBY_SITE_URL || "https://www.seusite.com",
  },
  plugins: [
    "gatsby-plugin-postcss",
    "gatsby-plugin-image",
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: `${__dirname}/src/images/`,
      },
    },
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        icon: "static/images/android-chrome-512x512.png",
      },
    },
    "gatsby-transformer-remark",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    {
      resolve: `gatsby-plugin-preconnect`,
      options: {
        domains: [`https://cdn.jotfor.ms`],
      },
    },
    `gatsby-plugin-netlify`,
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "city-templates",
        path: `${__dirname}/content/cities`,
      },
    },
  ],
};
