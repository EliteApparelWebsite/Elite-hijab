-- Password reset tokens for the email-link "Forgot password" flow.
-- A row is created when the user requests a reset and deleted once the
-- link is used (or expires 30 minutes after creation, whichever first).
create table if not exists password_reset_tokens (
  token text primary key,
  email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_email_idx on password_reset_tokens (email);
