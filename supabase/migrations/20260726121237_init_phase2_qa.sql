-- =============================================================================
-- v2 スキーマ 5/8: Phase 2 スキーマ先行（questions・answers）
-- 正: docs/rebuild/01-domain-model.md §3「Phase 2 スキーマ先行」
-- =============================================================================
-- UI は作らない。RLS は SELECT のみ許可し、INSERT/UPDATE/DELETE ポリシーを
-- 一切作らないことで書き込みを deny する（rls_policies migration）。
-- =============================================================================

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  author_user_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.questions is '資材への質問（Phase 2。v1 は UI なし・書き込み deny）。';

create index questions_material_id_idx on public.questions (material_id, created_at desc);
create index questions_author_user_id_idx on public.questions (author_user_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_user_id uuid references public.profiles (user_id) on delete cascade,
  author_seller_id uuid references public.seller_accounts (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint answers_single_author
    check (num_nonnulls(author_user_id, author_seller_id) = 1)
);

comment on table public.answers is
  '回答（Phase 2）。著者は一般ユーザーか出品者のどちらか一方。author_seller_id があれば公式回答。';

create index answers_question_id_idx on public.answers (question_id, created_at);
create index answers_author_user_id_idx on public.answers (author_user_id);
create index answers_author_seller_id_idx on public.answers (author_seller_id);

select app.sync_updated_at_triggers();
