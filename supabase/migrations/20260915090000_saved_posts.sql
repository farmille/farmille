-- 投稿の保存は本人だけが参照でき、公開中の投稿だけを追加できる。
create table public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  usage_report_id uuid references public.usage_reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_posts_one_target check (num_nonnulls(review_id, usage_report_id) = 1),
  unique (user_id, review_id),
  unique (user_id, usage_report_id)
);
alter table public.saved_posts enable row level security;
grant select, insert, delete on public.saved_posts to authenticated;
create policy saved_posts_read_self on public.saved_posts for select to authenticated
  using (user_id = auth.uid());
create policy saved_posts_delete_self on public.saved_posts for delete to authenticated
  using (user_id = auth.uid());
create policy saved_posts_insert_self on public.saved_posts for insert to authenticated
  with check (
    user_id = auth.uid() and (
      (review_id is not null and exists (select 1 from public.reviews where id = review_id and status = 'published')) or
      (usage_report_id is not null and exists (select 1 from public.usage_reports where id = usage_report_id and status = 'published'))
    )
  );
create index saved_posts_review_idx on public.saved_posts(review_id);
create index saved_posts_report_idx on public.saved_posts(usage_report_id);
