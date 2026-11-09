# Changelog

Notable project changes are recorded here by task and date.

## 2026-11-09

### TASK 049E — Client CMS resilience and structured editing

- Added an intentional internal-demo unavailable state while preserving the existing authorization boundary.
- Added typed, non-sensitive Client CMS media errors and accessible recoverable upload feedback; successful uploads expose the public URL for use in section image fields.
- Added structured Portuguese (Portugal) editing for existing FAQ/reviews/menu repeaters and six Restaurant Playful section types, retaining the persisted content contract and validated JSON for remaining types.
- Added deterministic regressions for disabled demos, media provider errors, content round-trip/unknown-field preservation, section validation and generated package source.
- Automated validation passed: lint, typecheck, 93 test files passed (10 skipped; 320 tests passed, 25 skipped), and production build. The build used the guarded `landingforge_qa` launcher and retained 12 existing dynamic-filesystem tracing warnings.
- No schema, seed, permission, publication or persistent customer data changed. An authenticated desktop/mobile browser review and live Storage retest were not available in this run; deterministic provider tests remain independent of those external checks.

### TASK 049D — Demo editorial and visual consistency

- Improved Bakery Playful featured CTA text and keyboard-focus contrast, with focused CSS contrast tests.
- Clarified Restaurant Playful sample menu currency and per-item pricing in the seed content.
- Removed public agent phone/email fields from the Real Estate Premium demo seed; internal form recipients were left unchanged.
- Corrected the Clinic Modern hero after authenticated runtime inspection showed the persisted image depicted a surgical team. Seed and the matching QA fixture now use an Unsplash image described as a doctor speaking with a patient; the reopened preview confirmed the replacement image and aligned alt text.
- Targeted transactions updated only the named Contact/Team fields, Restaurant Playful Menu and Clinic Modern Hero in `landingforge_qa`; no full seed was run, and the primary database/publication state was untouched.
- Authenticated CMS/preview checks confirmed the Bakery Playful CTA, Restaurant Playful pricing, Real Estate Premium agent cards and Clinic Modern hero. Browser preview Desktop/Mobile modes were used where available; the outer browser viewport was about 648 px and no 1440 px screenshot was archived. No screenshot of the final Clinic recheck was archived.

## 2026-11-08

### TASK 049C — CMS comprehension, navigation and PT-PT

- Clarified that Dashboard page/contact metrics are global and kept existing server calculations unchanged.
- Filtered Dashboard quick links through existing read permissions and hid Branding write controls for read-only roles.
- Added Escape dismissal and focus restoration to the Master CMS mobile disclosure.
- Localized identified CMS navigation, Dashboard, Pages/content editor, SEO, Branding, Settings, Analytics and section-type labels to PT-PT without changing persisted keys or server contracts.
- Corrected remaining legacy spellings and mixed-language SEO help found in the authenticated review; legal page options are presented with current PT-PT labels without changing stored values.
- Added regressions for permission-filtered quick links, supported section labels, PT-PT UI copy, SEO guidance and keyboard disclosure behavior.
- Automated validation passed. Authenticated visual retest observed Super Admin surfaces; exact viewport and Viewer checks were still pending at the time.
- Reproduced and fixed a real `/settings` horizontal clipping issue at 390 CSS px by making the base grid track explicitly shrinkable; preserved the existing two-column `lg` layout.
- Revalidated Dashboard, Branding, SEO and content editor at exact 1440×900 and 390×844 CSS viewports; Settings additionally passed 768×1024 and 648×900. Document/main widths showed no horizontal overflow after the fix.
- Confirmed mobile CMS navigation closes on Escape and restores focus. Viewer was not observed in runtime; existing automated permission tests remain evidence for its affordances. QA data and RBAC were not changed.
