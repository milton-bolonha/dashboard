# SaaS Plans and Limits

## Overview
This document outlines the features and limits for the Free, Pro, and Pro Plus plans.

## Plan Details

| Feature | Free | Pro | Pro Plus |
| :--- | :--- | :--- | :--- |
| **Monthly Price** | £0 | £19 | £69 |
| **Monthly Token Allowance** | 3000 tokens (~30 actions/tiles) | 20000 tokens (~150–200 tiles) | 75000 tokens (~600–750 tiles) |
| **Additional Token Cost** | Fixed Top Up Amount: £5 for 4000 tokens | Fixed Top Up Amount: £5 for 4000 tokens | Fixed Top Up Amount: £5 for 4000 tokens |
| **Companies Included** | 3 companies (can delete to create space) | 25 companies (can delete to create space) | 300 companies (can delete to create space) |
| **Contacts Included** | 5 contacts per company | 75 contacts | Unlimited contacts |
| **No. of Tiles on Company Research per Company** | 10 | 25 | Unlimited |
| **Tile-Based Research** | All types of tiles | All types of tiles | All types of tiles |
| **AI Tile Types Available** | All types of tiles | All types of tiles | All types of tiles |
| **Autosave most recent work** | Yes (as long as logged in) | Yes | Yes |
| **Pinning Tiles** | Yes | Yes | Yes |
| **Tile Version History** | Yes | Yes | Yes |
| **Tile Refreshing (TBC)** | Manual only | Manual refresh with updated data | Automatic weekly refresh + manual |
| **File Upload Limit** | 2 files/company | 10 files/company | Unlimited files per company |
| **File Types** | All file types | All file types + bulk uploads | All file types + bulk uploads |
| **Context Awareness in AI** | Full context | Full context | Full context |
| **Dashboard Cloning** | No | Yes | Yes |
| **Editable Dashboards** | Yes | Yes | Yes |
| **Contact Insights Tile** | Full insights + persona-based tone | Full insights + persona-based tone | Full insights + persona-based tone |
| **Email Outreach Tile** | As many as tokens allow | As many as tokens allow | As many as tokens allow |
| **Call Script Tile** | As many as tokens allow | As many as tokens allow | As many as tokens allow |
| **Account ICP Score** | Automatic - as soon as a company is added | Automatic - as soon as a company is added | Automatic - as soon as a company is added |
| **Ability to Share Dashboard as Webpage Link** | Yes - 3 a month | Yes | Yes |
| **CRM Integrations** | Yes - but limited to number of companies above | Yes - but limited to number of companies above | Yes |
| **Team Collaboration** | No | No | Yes |

## Stripe Information

### Pro Plan
- **Payment Link:** `https://buy.stripe.com/test_aFa7sL80L3FMh1AdzEcAo00`
- **Price ID:** `price_1SVLzlFTSyvO26ktr6SPtI90`

### Pro Plus Plan
- **Payment Link:** `https://buy.stripe.com/test_9B6fZh80L6RY6mWcvAcAo01`
- **Price ID:** `price_1SVM05FTSyvO26ktY1qgOMqv`

### Webhook
- **URL:** `https://webhook.site/992fa69e-1345-4f2b-97dc-3ee6a514313b` (Note: This seems to be a test URL, likely need to configure a real endpoint in the app)
- **Signing Secret:** `whsec_7SxNE87RzCJivHiNREKx3pVYCTqx66x7`

## Environment Variables
Existing variables related to limits:
- `MAX_TILES_PER_DAY=1000`
- `MAX_TILES_PER_HOUR=200`
- `MAX_REQUESTS_PER_MINUTE=20`

These need to be adapted to the per-plan limits (e.g., tokens, companies, contacts).
