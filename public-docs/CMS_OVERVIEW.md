# CMS Overview

LandingForge includes a focused CMS for managing landing pages, leads and related operational content.

The CMS is designed for landing page delivery, not full website building.

## CMS Goals

- Make landing page content editable.
- Keep template structure controlled.
- Reduce manual developer edits for routine updates.
- Support lead capture and follow-up workflows.
- Keep SEO and branding configuration accessible.

## Main Areas

### Dashboard

Overview of landing page activity, leads and system status.

### Pages

Create and manage landing pages, statuses and page-level metadata.

### Content

Manage page sections and demo content while preserving template structure.

### Media

Organize media assets and connect storage-backed uploads when configured.

### Forms

Configure lead capture forms, fields, validation and submission behaviour.

### Leads

Review leads, statuses, notes and export workflows.

### SEO

Manage metadata, local SEO data, redirects and structured data previews.

### Branding

Manage brand identity settings, colors, typography and logo assets.

### Settings

Configure security, notifications, legal/cookie settings and deployment readiness.

## Design Philosophy

The CMS exposes useful controls without allowing unlimited layout manipulation.

This helps keep:

- design quality consistent;
- templates maintainable;
- client editing simple;
- page performance predictable.

## Permissions

The CMS uses role-based access patterns so different users can access the areas relevant to their responsibilities.

Typical roles include:

- super admin;
- client admin;
- viewer.

## Public Page Relationship

CMS content feeds the public renderer. The public renderer then applies:

- selected template;
- section registry;
- theme configuration;
- SEO metadata;
- structured data;
- public forms.

