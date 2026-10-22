# Architecture Overview

LandingForge is built as a modular Next.js platform for creating and managing premium landing pages.

The architecture separates public rendering, CMS management, domain services, validation and persistence so that templates can evolve without turning the product into a generic website builder.

## Core Layers

```txt
App Router
  Public pages
  Protected CMS pages
  Route handlers

Features
  CMS
  Content
  Forms
  Leads
  SEO
  Branding
  Media
  Monitoring
  Public renderer
  Portfolio catalogue and publication policy

Infrastructure
  Prisma
  Auth.js
  Email
  Storage
  Security
```

## Main Principles

- Keep business logic out of UI components.
- Keep templates independent and reusable.
- Use typed validation before data reaches services.
- Keep CMS features focused on landing page management.
- Avoid duplicated template-specific logic.
- Prefer predictable data structures over ad hoc page building.

## Public Renderer

The public renderer is responsible for converting stored page content into public landing pages.

It uses:

- template registry;
- section registry;
- theme styling;
- public layout;
- structured data helpers;
- public form rendering.

This allows each landing page to remain CMS-editable while preserving a controlled design system.

## CMS Area

The protected CMS is used to manage:

- pages;
- content sections;
- demos;
- forms;
- leads;
- media;
- SEO;
- branding;
- settings;
- admin/audit views.

The CMS is not intended to be a generic website builder. It is intentionally scoped to landing page delivery and operations.

## Data Flow

```txt
CMS input
  -> Zod validation
  -> Server action or route handler
  -> Service layer
  -> Prisma
  -> PostgreSQL
  -> Public renderer
```

## Template Flow

```txt
Industry foundation
  -> Template variant
  -> Section definitions
  -> Demo seed content
  -> Public route
  -> CMS-editable landing page
```

## Portfolio Publication Flow

```txt
Demo page
  -> explicit review and portfolio visibility
  -> public catalogue/detail routes
  -> approved public page content and screenshots
```

CMS and dashboard screenshots are operational material and are not made public by the portfolio screenshot flow. Public repository screenshots require a separate review for consent, synthetic data and sensitive information.

## Quality Goals

- Maintainable code boundaries.
- Fast page rendering.
- Accessible UI.
- SEO-ready structure.
- Reusable section patterns.
- Safe handling of user input.

