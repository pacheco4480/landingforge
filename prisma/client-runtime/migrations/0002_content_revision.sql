ALTER TABLE lf_cms_pages
  ADD COLUMN IF NOT EXISTS content_revision integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS lf_cms_sections_page_order_idx
  ON lf_cms_sections(project_id, page_id, sort_order);
CREATE INDEX IF NOT EXISTS lf_cms_forms_page_idx
  ON lf_cms_forms(project_id, page_id);
CREATE INDEX IF NOT EXISTS lf_cms_submissions_project_created_idx
  ON lf_cms_submissions(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lf_cms_leads_project_created_idx
  ON lf_cms_leads(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lf_cms_media_project_created_idx
  ON lf_cms_media(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lf_cms_audit_project_created_idx
  ON lf_cms_audit_events(project_id, created_at DESC);
