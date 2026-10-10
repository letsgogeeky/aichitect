#!/bin/sh
# Runs the Supabase CLI inside the Alpine dev container. The npm wrapper
# (node_modules/supabase) resolves @supabase/cli-linux-<arch> (glibc) before
# the -musl variant, but on Alpine only the musl package ships a binary —
# the glibc one has an empty bin/ and every `make db-*` failed with
# "spawnSync .../cli-linux-arm64/bin/supabase ENOENT". Point the wrapper's
# own SUPABASE_CLI_BINARY_OVERRIDE at the musl binary when it exists.
for bin in node_modules/@supabase/cli-linux-*-musl/bin/supabase; do
  [ -x "$bin" ] && export SUPABASE_CLI_BINARY_OVERRIDE="$PWD/$bin"
done
exec npx supabase "$@"
