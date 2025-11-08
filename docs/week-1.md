# Week 1: AI Sales Assistant - Foundation

This week focuses on setting up the foundational elements of the AI Sales Assistant plugin.

## Tasks

- **Plugin Installer:**
  - Create `scripts/install-sales-assistant.js` to set up collections, indexes, and seed data.
  - Create `scripts/uninstall-sales-assistant.js` for cleanup.

- **Data Models & APIs:**
  - Implement MongoDB models for `companies`, `dashboards`, and `templates`.
  - Create CRUD APIs for Templates, Companies, and Dashboards.
  - Ensure all new routes are protected and use the `x-workspace-id` for multi-tenant data isolation.

- **Initial UI:**
  - Develop the initial UI for listing and creating companies and templates.
  - Create a basic tile view for a company's dashboard.

- **Deployment:**
  - Configure CI/CD (Netlify/Vercel) with necessary environment variables (OpenAI, Stripe, Mongo).

## Goal for the week

By the end of the week, we should have a V0.1 of the plugin. This version will allow users to create a company, add a prompt template, and execute a single research action that saves the result as a tile. No bulk operations or advanced features yet.
