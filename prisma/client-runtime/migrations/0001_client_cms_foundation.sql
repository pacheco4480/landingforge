CREATE TABLE IF NOT EXISTS lf_cms_installations (
  project_id uuid PRIMARY KEY,
  template_key text NOT NULL,
  variant_key text NOT NULL,
  template_version text NOT NULL,
  source_checksum char(64) NOT NULL,
  capabilities jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lf_cms_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES lf_cms_installations(project_id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('client_admin', 'viewer')),
  is_active boolean NOT NULL DEFAULT true,
  authorization_version integer NOT NULL DEFAULT 1,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id, email)
);

CREATE TABLE IF NOT EXISTS lf_cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES lf_cms_installations(project_id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id),
  UNIQUE (project_id, slug)
);

CREATE TABLE IF NOT EXISTS lf_cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  page_id uuid NOT NULL,
  section_key text NOT NULL,
  section_type text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id, page_id, section_key),
  FOREIGN KEY (project_id, page_id) REFERENCES lf_cms_pages(project_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lf_cms_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  page_id uuid NOT NULL,
  form_key text NOT NULL,
  name text NOT NULL,
  form_type text NOT NULL DEFAULT 'CONTACT',
  is_active boolean NOT NULL DEFAULT false,
  success_message text NOT NULL DEFAULT 'Obrigado pelo seu contacto.',
  error_message text NOT NULL DEFAULT 'Não foi possível enviar. Tente novamente.',
  recipient_email text NOT NULL DEFAULT '',
  consent_required boolean NOT NULL DEFAULT true,
  consent_label text NOT NULL DEFAULT 'Li e aceito a Política de Privacidade.',
  consent_version text NOT NULL DEFAULT '1.0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id, page_id, form_key),
  FOREIGN KEY (project_id, page_id) REFERENCES lf_cms_pages(project_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lf_cms_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  form_id uuid NOT NULL,
  field_name text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id, form_id, field_name),
  FOREIGN KEY (project_id, form_id) REFERENCES lf_cms_forms(project_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lf_cms_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  form_id uuid NOT NULL,
  page_id uuid NOT NULL,
  data jsonb NOT NULL,
  consent_given boolean NOT NULL DEFAULT false,
  consent_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  FOREIGN KEY (project_id, form_id) REFERENCES lf_cms_forms(project_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (project_id, page_id) REFERENCES lf_cms_pages(project_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS lf_cms_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  name text,
  email text,
  phone text,
  company text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id, submission_id),
  FOREIGN KEY (project_id, submission_id) REFERENCES lf_cms_submissions(project_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS lf_cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES lf_cms_installations(project_id) ON DELETE CASCADE,
  object_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  UNIQUE (project_id, object_path)
);

CREATE TABLE IF NOT EXISTS lf_cms_submission_limits (
  project_id uuid NOT NULL REFERENCES lf_cms_installations(project_id) ON DELETE CASCADE,
  key_hash char(64) NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (project_id, key_hash)
);

CREATE TABLE IF NOT EXISTS lf_cms_auth_limits (
  project_id uuid NOT NULL REFERENCES lf_cms_installations(project_id) ON DELETE CASCADE,
  key_hash char(64) NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (project_id, key_hash)
);

CREATE TABLE IF NOT EXISTS lf_cms_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (project_id, user_id) REFERENCES lf_cms_users(project_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lf_cms_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES lf_cms_installations(project_id) ON DELETE CASCADE,
  actor_user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lf_cms_schema_migrations (
  migration_name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
