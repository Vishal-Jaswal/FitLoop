create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  instructions text not null,
  primary_muscle_group text not null check (primary_muscle_group in (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps',
    'hamstrings', 'glutes', 'calves', 'core', 'full body'
  )),
  secondary_muscles text[] not null default '{}',
  equipment text not null check (equipment in (
    'barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'bodyweight', 'band', 'other'
  )),
  created_at timestamptz not null default pg_catalog.now()
);

create unique index exercise_catalog_name_ci_idx on public.exercise_catalog (pg_catalog.lower(name));
create index exercise_catalog_muscle_equipment_idx
  on public.exercise_catalog (primary_muscle_group, equipment, name);

create table public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(pg_catalog.btrim(name)) between 2 and 80),
  description text check (description is null or char_length(description) <= 500),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index workout_routines_owner_updated_idx
  on public.workout_routines (owner_id, updated_at desc);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.workout_routines (id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog (id) on delete restrict,
  position integer not null check (position >= 0),
  target_sets smallint not null default 3 check (target_sets between 1 and 20),
  target_reps_min smallint not null default 8 check (target_reps_min between 1 and 100),
  target_reps_max smallint check (target_reps_max is null or target_reps_max between target_reps_min and 100),
  rest_seconds smallint check (rest_seconds is null or rest_seconds between 0 and 900),
  created_at timestamptz not null default pg_catalog.now(),
  constraint routine_exercises_position_unique unique (routine_id, position)
    deferrable initially deferred
);

create index routine_exercises_exercise_idx on public.routine_exercises (exercise_id);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  source_routine_id uuid references public.workout_routines (id) on delete set null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'cancelled')),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  started_at timestamptz not null default pg_catalog.now(),
  finished_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 1000),
  constraint workout_sessions_finished_state_check check (
    (status = 'in_progress' and finished_at is null) or
    (status in ('completed', 'cancelled') and finished_at is not null)
  )
);

create unique index workout_sessions_one_active_per_owner_idx
  on public.workout_sessions (owner_id) where status = 'in_progress';
create index workout_sessions_owner_started_idx
  on public.workout_sessions (owner_id, started_at desc);
create index workout_sessions_owner_completed_idx
  on public.workout_sessions (owner_id, started_at desc)
  where status = 'completed';

create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog (id) on delete restrict,
  exercise_name_snapshot text not null,
  primary_muscle_group_snapshot text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default pg_catalog.now(),
  constraint workout_session_exercises_position_unique unique (session_id, position)
    deferrable initially deferred
);

create index workout_session_exercises_exercise_idx
  on public.workout_session_exercises (exercise_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.workout_session_exercises (id) on delete cascade,
  position integer not null check (position >= 0),
  set_type text not null default 'working' check (set_type in ('warmup', 'working')),
  reps smallint check (reps is null or reps between 1 and 1000),
  weight_kg numeric(8, 3) check (weight_kg is null or weight_kg >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  constraint workout_sets_position_unique unique (session_exercise_id, position)
    deferrable initially deferred,
  constraint workout_sets_completed_values_check check (
    completed_at is null or (reps is not null and weight_kg is not null)
  )
);

create index workout_sets_exercise_position_idx
  on public.workout_sets (session_exercise_id, position);

alter table public.exercise_catalog enable row level security;
alter table public.workout_routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;

revoke all on table public.exercise_catalog, public.workout_routines,
  public.routine_exercises, public.workout_sessions,
  public.workout_session_exercises, public.workout_sets
  from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on table public.exercise_catalog to authenticated;
grant select, insert, update, delete on table public.workout_routines,
  public.routine_exercises to authenticated;
grant select, insert (owner_id, source_routine_id, weight_unit, notes),
  update (status, finished_at, notes), delete
  on table public.workout_sessions to authenticated;
grant select, insert, delete on table public.workout_session_exercises to authenticated;
grant select, insert, update (reps, weight_kg, completed_at), delete
  on table public.workout_sets to authenticated;

create policy exercise_catalog_authenticated_read
  on public.exercise_catalog for select to authenticated using (true);

create policy workout_routines_select_own
  on public.workout_routines for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy workout_routines_insert_own
  on public.workout_routines for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy workout_routines_update_own
  on public.workout_routines for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy workout_routines_delete_own
  on public.workout_routines for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy routine_exercises_select_own
  on public.routine_exercises for select to authenticated using (
    exists (
      select 1 from public.workout_routines r
      where r.id = routine_id and r.owner_id = (select auth.uid())
    )
  );
create policy routine_exercises_insert_own
  on public.routine_exercises for insert to authenticated with check (
    exists (
      select 1 from public.workout_routines r
      where r.id = routine_id and r.owner_id = (select auth.uid())
    )
  );
create policy routine_exercises_update_own
  on public.routine_exercises for update to authenticated
  using (
    exists (
      select 1 from public.workout_routines r
      where r.id = routine_id and r.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workout_routines r
      where r.id = routine_id and r.owner_id = (select auth.uid())
    )
  );
create policy routine_exercises_delete_own
  on public.routine_exercises for delete to authenticated using (
    exists (
      select 1 from public.workout_routines r
      where r.id = routine_id and r.owner_id = (select auth.uid())
    )
  );

create policy workout_sessions_select_own
  on public.workout_sessions for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy workout_sessions_insert_own
  on public.workout_sessions for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (
      source_routine_id is null or exists (
        select 1 from public.workout_routines r
        where r.id = source_routine_id and r.owner_id = (select auth.uid())
      )
    )
  );
create policy workout_sessions_update_own
  on public.workout_sessions for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (
      source_routine_id is null or exists (
        select 1 from public.workout_routines r
        where r.id = source_routine_id and r.owner_id = (select auth.uid())
      )
    )
  );
create policy workout_sessions_delete_own
  on public.workout_sessions for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy workout_session_exercises_select_own
  on public.workout_session_exercises for select to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.owner_id = (select auth.uid())
    )
  );
create policy workout_session_exercises_insert_own
  on public.workout_session_exercises for insert to authenticated with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  );
create policy workout_session_exercises_update_own
  on public.workout_session_exercises for update to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  );
create policy workout_session_exercises_delete_own
  on public.workout_session_exercises for delete to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  );

create policy workout_sets_select_own
  on public.workout_sets for select to authenticated using (
    exists (
      select 1
      from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.owner_id = (select auth.uid())
    )
  );
create policy workout_sets_insert_own
  on public.workout_sets for insert to authenticated with check (
    exists (
      select 1
      from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  );
create policy workout_sets_update_own
  on public.workout_sets for update to authenticated
  using (
    exists (
      select 1
      from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  )
  with check (
    exists (
      select 1
      from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  );
create policy workout_sets_delete_own
  on public.workout_sets for delete to authenticated using (
    exists (
      select 1
      from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.owner_id = (select auth.uid())
        and s.status = 'in_progress'
    )
  );

create function public.start_workout_from_routine(p_routine_id uuid, p_weight_unit text default 'kg')
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_weight_unit not in ('kg', 'lb') then
    raise exception 'Unsupported weight unit';
  end if;
  if not exists (
    select 1 from public.workout_routines r
    where r.id = p_routine_id and r.owner_id = v_user_id
  ) then
    raise exception 'Routine not found';
  end if;

  insert into public.workout_sessions (owner_id, source_routine_id, weight_unit)
  values (v_user_id, p_routine_id, p_weight_unit)
  returning id into v_session_id;

  insert into public.workout_session_exercises (
    session_id, exercise_id, exercise_name_snapshot,
    primary_muscle_group_snapshot, position
  )
  select v_session_id, e.id, e.name, e.primary_muscle_group, re.position
  from public.routine_exercises re
  join public.exercise_catalog e on e.id = re.exercise_id
  where re.routine_id = p_routine_id
  order by re.position;

  insert into public.workout_sets (session_exercise_id, position, set_type)
  select se.id, planned_set.position::integer, 'working'
  from public.workout_session_exercises se
  join public.routine_exercises planned
    on planned.routine_id = p_routine_id and planned.position = se.position
  cross join lateral pg_catalog.generate_series(0, planned.target_sets - 1) as planned_set(position)
  where se.session_id = v_session_id;

  return v_session_id;
end;
$$;

create function public.reorder_routine_exercises(p_routine_id uuid, p_exercise_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.workout_routines r
    where r.id = p_routine_id and r.owner_id = (select auth.uid())
  ) then
    raise exception 'Routine not found';
  end if;

  select count(*) into v_count
  from public.routine_exercises re where re.routine_id = p_routine_id;

  if v_count <> coalesce(pg_catalog.cardinality(p_exercise_ids), 0)
    or v_count <> (
      select count(distinct item.id)
      from pg_catalog.unnest(coalesce(p_exercise_ids, array[]::uuid[])) as item(id)
    )
    or exists (
      select 1
      from pg_catalog.unnest(coalesce(p_exercise_ids, array[]::uuid[])) as item(id)
      left join public.routine_exercises re
        on re.id = item.id and re.routine_id = p_routine_id
      where re.id is null
    ) then
    raise exception 'Exercise order must contain every routine exercise exactly once';
  end if;

  update public.routine_exercises re
  set position = item.ordinality::integer - 1
  from pg_catalog.unnest(coalesce(p_exercise_ids, array[]::uuid[]))
    with ordinality as item(id, ordinality)
  where re.routine_id = p_routine_id and re.id = item.id;

  update public.workout_routines
  set updated_at = pg_catalog.now()
  where id = p_routine_id and owner_id = (select auth.uid());
end;
$$;

create function public.finish_workout(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.workout_sessions s
    join public.workout_session_exercises se on se.session_id = s.id
    join public.workout_sets ws on ws.session_exercise_id = se.id
    where s.id = p_session_id and s.owner_id = (select auth.uid())
      and s.status = 'in_progress' and ws.set_type = 'working'
      and ws.completed_at is not null
  ) then
    raise exception 'Complete at least one working set before finishing';
  end if;

  update public.workout_sessions
  set status = 'completed', finished_at = pg_catalog.now()
  where id = p_session_id and owner_id = (select auth.uid())
    and status = 'in_progress';

  if not found then
    raise exception 'Active workout not found';
  end if;
end;
$$;

revoke all on function public.start_workout_from_routine(uuid, text) from public, anon;
revoke all on function public.reorder_routine_exercises(uuid, uuid[]) from public, anon;
revoke all on function public.finish_workout(uuid) from public, anon;
grant execute on function public.start_workout_from_routine(uuid, text) to authenticated;
grant execute on function public.reorder_routine_exercises(uuid, uuid[]) to authenticated;
grant execute on function public.finish_workout(uuid) to authenticated;

insert into public.exercise_catalog (slug, name, instructions, primary_muscle_group, secondary_muscles, equipment)
values
  ('barbell-back-squat', 'Barbell Back Squat', 'Brace your core, sit between your hips, and drive through the whole foot to stand.', 'quadriceps', array['glutes', 'core'], 'barbell'),
  ('barbell-front-squat', 'Barbell Front Squat', 'Keep elbows high, descend with control, and stand while keeping your torso upright.', 'quadriceps', array['glutes', 'core'], 'barbell'),
  ('goblet-squat', 'Goblet Squat', 'Hold one dumbbell close to your chest, squat between your knees, and stand tall.', 'quadriceps', array['glutes', 'core'], 'dumbbell'),
  ('leg-press', 'Leg Press', 'Lower the platform until your knees are comfortably bent, then press without locking your knees.', 'quadriceps', array['glutes'], 'machine'),
  ('leg-extension', 'Leg Extension', 'Extend your knees smoothly, pause briefly, and lower the weight with control.', 'quadriceps', array[], 'machine'),
  ('romanian-deadlift', 'Romanian Deadlift', 'Push your hips back with a soft knee bend, keep the load close, and stand by driving your hips forward.', 'hamstrings', array['glutes', 'back'], 'barbell'),
  ('barbell-deadlift', 'Barbell Deadlift', 'Brace, hinge to the bar, and push the floor away while keeping the bar close to your body.', 'hamstrings', array['glutes', 'back', 'core'], 'barbell'),
  ('lying-leg-curl', 'Lying Leg Curl', 'Curl the pad toward your hips without lifting your pelvis, then return slowly.', 'hamstrings', array['calves'], 'machine'),
  ('hip-thrust', 'Barbell Hip Thrust', 'Rest your upper back on a bench, tuck your ribs, and extend your hips until your torso is level.', 'glutes', array['hamstrings', 'core'], 'barbell'),
  ('glute-bridge', 'Glute Bridge', 'Press through your heels and lift your hips while keeping your ribs down.', 'glutes', array['hamstrings', 'core'], 'bodyweight'),
  ('standing-calf-raise', 'Standing Calf Raise', 'Rise onto the balls of your feet, pause at the top, and lower through a comfortable stretch.', 'calves', array[], 'machine'),
  ('bench-press', 'Barbell Bench Press', 'Set your shoulders, lower the bar to mid-chest with control, and press up over your shoulders.', 'chest', array['triceps', 'shoulders'], 'barbell'),
  ('incline-dumbbell-press', 'Incline Dumbbell Press', 'Lower dumbbells beside your upper chest, then press up without letting them collide.', 'chest', array['triceps', 'shoulders'], 'dumbbell'),
  ('push-up', 'Push-Up', 'Keep a straight line from head to heels, lower your chest, and press the floor away.', 'chest', array['triceps', 'core'], 'bodyweight'),
  ('cable-fly', 'Cable Fly', 'With a soft bend in your elbows, bring the handles together in front of your chest.', 'chest', array['shoulders'], 'cable'),
  ('chest-press-machine', 'Chest Press Machine', 'Set the handles near mid-chest, press forward smoothly, and return under control.', 'chest', array['triceps', 'shoulders'], 'machine'),
  ('lat-pulldown', 'Lat Pulldown', 'Pull the bar toward your upper chest by driving your elbows down, then reach up with control.', 'back', array['biceps'], 'cable'),
  ('seated-cable-row', 'Seated Cable Row', 'Sit tall, pull the handle toward your lower ribs, and extend your arms without rounding.', 'back', array['biceps'], 'cable'),
  ('one-arm-dumbbell-row', 'One-Arm Dumbbell Row', 'Brace on a bench and pull the dumbbell toward your hip without rotating your torso.', 'back', array['biceps'], 'dumbbell'),
  ('pull-up', 'Pull-Up', 'Start from a controlled hang, pull your chest toward the bar, and lower without swinging.', 'back', array['biceps', 'core'], 'bodyweight'),
  ('assisted-pull-up', 'Assisted Pull-Up', 'Use the assistance platform, pull your chest toward the bar, and lower slowly.', 'back', array['biceps'], 'machine'),
  ('face-pull', 'Face Pull', 'Pull the rope toward eye level, separate your hands, and keep your shoulders down.', 'shoulders', array['back'], 'cable'),
  ('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'Press dumbbells overhead from shoulder height while keeping your ribs stacked over your hips.', 'shoulders', array['triceps', 'core'], 'dumbbell'),
  ('lateral-raise', 'Dumbbell Lateral Raise', 'Raise your arms out to the sides with a slight elbow bend, then lower slowly.', 'shoulders', array[], 'dumbbell'),
  ('machine-shoulder-press', 'Machine Shoulder Press', 'Set handles around shoulder height and press overhead without arching your lower back.', 'shoulders', array['triceps'], 'machine'),
  ('barbell-curl', 'Barbell Curl', 'Keep your elbows near your sides, curl the bar without swinging, and lower fully.', 'biceps', array['forearms'], 'barbell'),
  ('dumbbell-hammer-curl', 'Dumbbell Hammer Curl', 'Keep palms facing each other and curl without moving your upper arms forward.', 'biceps', array['forearms'], 'dumbbell'),
  ('cable-triceps-pressdown', 'Cable Triceps Pressdown', 'Keep elbows by your sides and press the handle down until your arms are straight.', 'triceps', array[], 'cable'),
  ('overhead-triceps-extension', 'Overhead Triceps Extension', 'Keep your upper arms steady as you lower the weight behind your head and extend.', 'triceps', array[], 'dumbbell'),
  ('plank', 'Plank', 'Brace your midsection, keep a straight line through your body, and breathe steadily.', 'core', array['shoulders'], 'bodyweight'),
  ('dead-bug', 'Dead Bug', 'Keep your lower back gently against the floor as you extend opposite arm and leg.', 'core', array[], 'bodyweight'),
  ('cable-crunch', 'Cable Crunch', 'Kneel facing the cable and curl your ribs toward your pelvis without pulling with your arms.', 'core', array[], 'cable'),
  ('kettlebell-swing', 'Kettlebell Swing', 'Hinge at the hips and drive them forward to swing the kettlebell; keep your arms relaxed.', 'full body', array['glutes', 'hamstrings', 'core'], 'kettlebell'),
  ('dumbbell-lunge', 'Dumbbell Lunge', 'Step into a stable stance, lower both knees with control, and push through the front foot.', 'quadriceps', array['glutes'], 'dumbbell'),
  ('bulgarian-split-squat', 'Bulgarian Split Squat', 'Place your rear foot on a bench, lower straight down, and push through the front foot.', 'quadriceps', array['glutes'], 'dumbbell'),
  ('step-up', 'Dumbbell Step-Up', 'Place your whole foot on the bench, stand through the lead leg, and step down slowly.', 'glutes', array['quadriceps'], 'dumbbell'),
  ('seated-leg-curl', 'Seated Leg Curl', 'Align your knees with the machine pivot, curl the pad down, and return slowly.', 'hamstrings', array['calves'], 'machine'),
  ('cable-pull-through', 'Cable Pull-Through', 'Hinge your hips back against the cable, then stand by squeezing your glutes.', 'glutes', array['hamstrings'], 'cable'),
  ('reverse-fly-machine', 'Reverse Fly Machine', 'With a soft elbow bend, move your arms out and back, then return without shrugging.', 'shoulders', array['back'], 'machine'),
  ('incline-push-up', 'Incline Push-Up', 'Place your hands on a stable raised surface and lower your chest with a straight body line.', 'chest', array['triceps', 'core'], 'bodyweight'),
  ('close-grip-bench-press', 'Close-Grip Bench Press', 'Use a comfortable narrower grip, lower to your chest, and press while keeping wrists stacked.', 'triceps', array['chest', 'shoulders'], 'barbell'),
  ('ez-bar-curl', 'EZ-Bar Curl', 'Hold the angled grips and curl smoothly while keeping your upper arms by your sides.', 'biceps', array['forearms'], 'barbell'),
  ('machine-row', 'Machine Row', 'Brace against the pad and draw the handles toward your torso without shrugging.', 'back', array['biceps'], 'machine'),
  ('dumbbell-chest-fly', 'Dumbbell Chest Fly', 'With a soft elbow bend, open your arms until you feel a comfortable chest stretch, then bring them together.', 'chest', array['shoulders'], 'dumbbell'),
  ('arnold-press', 'Arnold Press', 'Rotate your palms forward as you press overhead, then reverse the movement slowly.', 'shoulders', array['triceps'], 'dumbbell'),
  ('single-leg-calf-raise', 'Single-Leg Calf Raise', 'Balance on one foot, rise onto the ball of your foot, pause, and lower slowly.', 'calves', array[], 'bodyweight'),
  ('hanging-knee-raise', 'Hanging Knee Raise', 'Hang from a stable bar and raise your knees by curling your pelvis, then lower without swinging.', 'core', array['grip'], 'bodyweight'),
  ('dumbbell-farmer-carry', 'Dumbbell Farmer Carry', 'Hold weights at your sides, stand tall, and walk with short controlled steps.', 'full body', array['core', 'forearms'], 'dumbbell'),
  ('band-pull-apart', 'Band Pull-Apart', 'Hold a band at shoulder height and pull your hands apart while keeping your shoulders relaxed.', 'back', array['shoulders'], 'band'),
  ('kettlebell-goblet-squat', 'Kettlebell Goblet Squat', 'Hold the kettlebell at your chest, squat between your hips, and stand with control.', 'quadriceps', array['glutes', 'core'], 'kettlebell')
on conflict (slug) do nothing;
