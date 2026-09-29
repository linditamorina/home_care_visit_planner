-- Mbyll dritaren e garës (race condition) te krijoVizite: kontrolli i konfliktit atje bën
-- SELECT (a ekziston mbivendosje?) e pastaj INSERT, pa asnjë kufizim mes tyre — dy kërkesa
-- njëkohësisht për të njëjtin ekip/orar mund të kalojnë të dyja SELECT-in përpara se
-- njëra prej tyre të bëjë INSERT, duke lejuar dyfish-rezervim të padetektuar.
--
-- Ky kufizim e ndalon fizikisht mbivendosjen në nivel databaze (jo vetëm në nivel
-- aplikacioni), pavarësisht sa kërkesa arrijnë njëkohësisht. Pasqyron saktësisht kushtin
-- që krijoVizite tashmë e zbaton në kontrollin e vet paraprak (lt/gt mbi scheduled_start/
-- scheduled_end, duke përjashtuar vizitat e anuluara dhe kategorinë "Laborator", e cila
-- lejohet me qëllim të mbivendoset me vizitën kryesore të ekipit).

create extension if not exists btree_gist;

alter table public.visits
  add constraint no_overlapping_team_visits
  exclude using gist (
    assigned_team_id with =,
    tstzrange(scheduled_start, scheduled_end) with &&
  )
  where (
    assigned_team_id is not null
    and status <> 'cancelled'
    and care_category <> 'Laborator'
  );
