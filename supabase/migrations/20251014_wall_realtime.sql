-- Enable Realtime for wall tables
alter publication supabase_realtime add table public.wall_posts;
alter publication supabase_realtime add table public.wall_comments;
alter publication supabase_realtime add table public.wall_attachments;
alter publication supabase_realtime add table public.wall_reactions;
alter publication supabase_realtime add table public.wall_polls;
alter publication supabase_realtime add table public.wall_poll_options;
alter publication supabase_realtime add table public.wall_poll_votes;
