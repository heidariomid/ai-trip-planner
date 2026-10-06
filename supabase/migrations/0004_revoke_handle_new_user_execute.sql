-- handle_new_user is security definer and lives in public, so the Data API
-- lists it as callable. Only the on_auth_user_created trigger should run it,
-- and a trigger does not need the caller to hold execute.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
