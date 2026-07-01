#!/usr/bin/env bash
# =============================================================================
# backcommit.sh  -  build the FullStack Estate git history across July-August
#
# Schedule : 7-day streaks, then a 1-2 day break, repeated from Jul 1 to Aug 31
# Per day  : 2-3 commits at random times (10:00-23:30 IST), in time order
# Content  : real project files committed in the build order from README §11
#            (backend skeleton -> errors -> auth -> listings -> bookings ->
#             uploads -> hardening -> tests -> frontend -> docs). Spare slots
#            get a dated entry in DEVLOG.md so no commit is empty.
#
# Usage (run from the project root, e.g. fullstack-estate/):
#   DRY_RUN=1 bash backcommit.sh      # preview the schedule, changes nothing
#   bash backcommit.sh                # create the commits
#
# Options (environment variables):
#   YEAR=2026            year for July/August
#   STREAK_MIN=7 STREAK_MAX=7   consecutive active days per streak
#   GAP_MIN=1 GAP_MAX=2         days off between streaks
#   PER_DAY_MIN=2 PER_DAY_MAX=3 commits per active day
#   TZ_OFFSET=+0530      timezone written into the commit dates
#   SEED=42              fixed seed -> the same schedule every run
#   FORCE=1              allow running in a repo that already has commits
# =============================================================================
set -euo pipefail

YEAR="${YEAR:-2026}"
START="${START:-$YEAR-07-01}"
END="${END:-$YEAR-08-31}"
STREAK_MIN="${STREAK_MIN:-7}"; STREAK_MAX="${STREAK_MAX:-7}"
GAP_MIN="${GAP_MIN:-1}";       GAP_MAX="${GAP_MAX:-2}"
PER_DAY_MIN="${PER_DAY_MIN:-2}"; PER_DAY_MAX="${PER_DAY_MAX:-3}"
TZ_OFFSET="${TZ_OFFSET:-+0530}"
DRY_RUN="${DRY_RUN:-0}"
FORCE="${FORCE:-0}"
[[ -n "${SEED:-}" ]] && RANDOM="$SEED"

die()  { echo "ERROR: $*" >&2; exit 1; }
rand() { R=$(( $1 + RANDOM % ($2 - $1 + 1) )); }   # result in $R (no subshell, so SEED works)

# --- date helper: GNU date (Linux, Git Bash on Windows) or BSD date (macOS) --
if date -d "2026-01-01 + 1 days" +%F >/dev/null 2>&1; then
  add_days() { date -d "$1 + $2 days" +%F; }
else
  add_days() { date -j -v+"$2"d -f %F "$1" +%F; }
fi

# =============================================================================
# 1. Commit plan: "message|space-separated paths or globs"
#    Missing paths are skipped, so it still works if a filename differs a bit.
# =============================================================================
TASKS=(
  # Phase 1: backend skeleton
  "chore: initial commit with .gitignore|.gitignore"
  "chore(server): init server package and dev script|server/package.json server/package-lock.json"
  "feat(server): add MongoDB connection config|server/config/db.js"
  "feat(server): set up express app with json and cookie parser|server/app.js"
  "feat(server): add entry point and /api/health route|server/index.js"
  "chore(server): add .env.example|server/.env.example server/nodemon.json"
  # Phase 2: error handling
  "feat(server): add errorHandler helper|server/utils/error.js"
  "feat(server): add centralized error middleware|server/middleware/error.middleware.js"
  # Phase 3: users + auth
  "feat(models): add User model|server/models/user.model.js"
  "feat(auth): signup and signin with bcrypt|server/controllers/auth.controller.js"
  "feat(auth): mount auth routes|server/routes/auth.route.js"
  "feat(auth): strip password from user responses|server/utils/sanitizeUser.js"
  "feat(auth): add verifyToken middleware|server/middleware/verifyToken.js"
  "feat(auth): access and refresh tokens with rotation|server/utils/tokens.js"
  # Phase 4: listings
  "feat(models): add Listing model with validators and indexes|server/models/listing.model.js"
  "feat(listing): business rules and field whitelist|server/utils/validateListing.js"
  "feat(listing): CRUD, search, filters and pagination|server/controllers/listing.controller.js"
  "feat(listing): add listing routes|server/routes/listing.route.js"
  # Phase 5: users, bookings, uploads
  "feat(user): update profile, delete account, my listings|server/controllers/user.controller.js"
  "feat(user): add user routes|server/routes/user.route.js"
  "feat(models): add Booking model|server/models/booking.model.js"
  "feat(booking): create bookings and update status|server/controllers/booking.controller.js"
  "feat(booking): add booking routes|server/routes/booking.route.js"
  "feat(upload): add multer config|server/config/upload.js"
  "feat(upload): upload middleware with size and type limits|server/middleware/upload.js"
  "feat(upload): check magic bytes and save to disk|server/controllers/upload.controller.js"
  "feat(upload): upload route and static /uploads|server/routes/upload.route.js server/uploads/.gitkeep"
  # Phase 6: hardening
  "feat(security): requireStrings and validateObjectId middleware|server/middleware/validate.js"
  "feat(auth): verify Google ID token with firebase-admin|server/utils/firebase*"
  # Phase 7: tests
  "test: in-memory MongoDB setup|server/tests/env.js server/tests/helpers/db.js server/jest.config.js"
  "test: add data factories|server/tests/helpers/factory.js"
  "test(auth): signup, signin, refresh rotation, google|server/tests/auth.test.js"
  "test(listing): CRUD, ownership 403, search and filters|server/tests/listing.test.js"
  "test(booking): date rules, duplicates, status changes|server/tests/booking.test.js"
  "test(upload): MIME, size and disguised-file checks|server/tests/upload.test.js"
  "test: unit tests for helpers and middleware|server/tests/unit.test.js server/tests"
  # Phase 8: frontend skeleton
  "chore(client): scaffold Vite React app|client/package.json client/package-lock.json client/index.html client/eslint.config.js client/.eslintrc* client/public"
  "chore(client): set up Tailwind CSS|client/tailwind.config.js client/postcss.config.js client/src/index.css"
  "chore(client): proxy /api and /uploads to the backend|client/vite.config.js"
  "feat(client): fetch wrapper with silent token refresh|client/src/api"
  "feat(client): redux store and user slice|client/src/redux"
  "feat(client): app shell with router and persist gate|client/src/main.jsx client/src/App.jsx"
  # Phase 9: pages + components
  "feat(ui): add Header|client/src/components/Header*"
  "feat(ui): add PrivateRoute|client/src/components/PrivateRoute*"
  "feat(ui): add Button, FormInput and Status components|client/src/components/Button* client/src/components/FormInput* client/src/components/Status*"
  "feat(pages): add SignUp page|client/src/pages/SignUp*"
  "feat(pages): add SignIn page|client/src/pages/SignIn*"
  "chore(client): add .env.example|client/.env.example"
  "feat(auth): add Firebase client config|client/src/firebase*"
  "feat(ui): continue with Google button|client/src/components/OAuth*"
  "feat(pages): profile update, avatar, sign out, delete|client/src/pages/Profile*"
  "feat(client): parallel image uploads with progress|client/src/utils/uploadImages*"
  "feat(pages): CreateListing for create and edit|client/src/pages/CreateListing*"
  "feat(ui): add ListingCard|client/src/components/ListingCard*"
  "feat(ui): add ImageSlider|client/src/components/ImageSlider*"
  "feat(client): formatting helpers|client/src/utils"
  "feat(pages): listing page with booking form|client/src/pages/Listing.*"
  "feat(ui): add FilterSidebar|client/src/components/FilterSidebar*"
  "feat(pages): search with filters, sort and show more|client/src/pages/Search*"
  "feat(pages): home with offer, rent and sale sections|client/src/pages/Home*"
  "feat(pages): MyBookings page with two tabs|client/src/pages/MyBookings*"
  "feat(pages): add NotFound page|client/src/pages/NotFound* client/src/components client/src/pages"
  # Phase 10: docs + deploy
  "docs: add Postman collection|postman"
  "chore: root scripts for install, build and start|package.json package-lock.json"
  "docs: add README|README.md"
  "chore: add remaining project files|."
)

DEVLOG_MSGS=(
  "docs(devlog): notes on %s"
  "docs(devlog): todo list for %s"
  "docs: update dev log"
  "docs(devlog): progress on %s"
)

# =============================================================================
# 2. Build the day schedule: STREAK days on, GAP days off, repeat
# =============================================================================
DAYS=()
d="$START"
while [[ ! "$d" > "$END" ]]; do
  rand "$STREAK_MIN" "$STREAK_MAX"; streak=$R
  for ((i = 0; i < streak; i++)); do
    [[ "$d" > "$END" ]] && break
    DAYS+=("$d")
    d=$(add_days "$d" 1)
  done
  rand "$GAP_MIN" "$GAP_MAX"; d=$(add_days "$d" "$R")
done

# =============================================================================
# 3. Commit slots: 2-3 random times per day, sorted
# =============================================================================
SLOTS=()
for day in "${DAYS[@]}"; do
  rand "$PER_DAY_MIN" "$PER_DAY_MAX"; n=$R
  times=()
  for ((i = 0; i < n; i++)); do
    # seconds between 10:00:00 and 23:30:00
    times+=( $(( 36000 + ( (RANDOM * 32768 + RANDOM) % 48600 ) )) )
  done
  while read -r s; do
    SLOTS+=("$day $(printf '%02d:%02d:%02d' $((s/3600)) $((s%3600/60)) $((s%60)))")
  done < <(printf '%s\n' "${times[@]}" | sort -n)
done

N=${#TASKS[@]}
S=${#SLOTS[@]}
(( S >= N )) || die "Only $S commit slots for $N planned commits. Raise PER_DAY_MAX or STREAK_MAX."

echo "Schedule: ${#DAYS[@]} active days, $S commits ($N project commits + $((S - N)) dev-log entries)"
echo

# =============================================================================
# 4. Safety checks (skipped in dry run)
# =============================================================================
if [[ "$DRY_RUN" != "1" ]]; then
  [[ -d server || -d client ]] || die "Run this from the project root (the folder with server/ and client/)."

  if [[ ! -d .git ]]; then
    git init -q
    git symbolic-ref HEAD refs/heads/main
    echo "Initialised a new git repo on branch main."
  elif git rev-parse --verify -q HEAD >/dev/null && [[ "$FORCE" != "1" ]]; then
    die "This repo already has commits. Use a fresh repo, or set FORCE=1 to add on top."
  fi

  git config user.name  >/dev/null || die "Set your name:  git config user.name \"Your Name\""
  git config user.email >/dev/null || die "Set your email: git config user.email \"you@example.com\" (use your GitHub email)"

  if [[ ! -f .gitignore ]]; then
    cat > .gitignore <<'EOF'
node_modules/
.env
.env.*
!.env.example
dist/
coverage/
serviceAccount*.json
server/uploads/*
!server/uploads/.gitkeep
.DS_Store
EOF
    echo "Created .gitignore (node_modules, .env, uploads, coverage...)."
  fi
  git check-ignore -q server/.env      || die ".gitignore does not ignore server/.env. Fix it before committing secrets."
  git check-ignore -q node_modules/x   || die ".gitignore does not ignore node_modules."
  mkdir -p server/uploads && touch server/uploads/.gitkeep
fi

# =============================================================================
# 5. Create the commits
# =============================================================================
shopt -s nullglob dotglob

stage_paths() {             # $1 = space-separated paths/globs
  local pat f
  for pat in $1; do
    if [[ "$pat" == "." ]]; then git add -A; continue; fi
    for f in $pat; do git add -- "$f" 2>/dev/null || true; done
  done
}

scope_of() {                # "feat(auth): ..." -> "auth"
  local s="${1%%:*}"
  [[ "$s" == *"("*")"* ]] && { s="${s#*(}"; echo "${s%)*}"; } || echo "project setup"
}

commit_at() {               # $1 = "YYYY-MM-DD HH:MM:SS", $2 = message
  GIT_AUTHOR_DATE="$1 $TZ_OFFSET" GIT_COMMITTER_DATE="$1 $TZ_OFFSET" \
    git commit -q -m "$2"
}

done_upto=-1
last_msg="${TASKS[0]%%|*}"

for ((i = 0; i < S; i++)); do
  when="${SLOTS[$i]}"
  target=$(( i * N / S ))                # spreads project commits evenly

  if (( target > done_upto )); then
    # ---- real project commit ----
    task="${TASKS[$target]}"
    msg="${task%%|*}"; paths="${task#*|}"
    if [[ "$DRY_RUN" == "1" ]]; then
      printf '%s  %s\n' "$when" "$msg"
    else
      for ((t = done_upto + 1; t <= target; t++)); do stage_paths "${TASKS[$t]#*|}"; done
      if git diff --cached --quiet; then  # file missing in your tree: keep the commit non-empty
        printf -- '- %s: %s\n' "${when%% *}" "$msg" >> DEVLOG.md
        git add DEVLOG.md
      fi
      commit_at "$when" "$msg"
    fi
    done_upto=$target
    last_msg="$msg"
  else
    # ---- dev-log entry ----
    scope=$(scope_of "$last_msg")
    tmpl="${DEVLOG_MSGS[$(( RANDOM % ${#DEVLOG_MSGS[@]} ))]}"
    msg=$(printf "$tmpl" "$scope")
    if [[ "$DRY_RUN" == "1" ]]; then
      printf '%s  %s\n' "$when" "$msg"
    else
      [[ -f DEVLOG.md ]] || printf '# Dev log\n\n' > DEVLOG.md
      printf -- '- %s %s: worked on %s (after "%s")\n' \
        "${when%% *}" "${when#* }" "$scope" "$last_msg" >> DEVLOG.md
      git add DEVLOG.md
      commit_at "$when" "$msg"
    fi
  fi
done

if [[ "$DRY_RUN" == "1" ]]; then
  echo; echo "Dry run only. Run without DRY_RUN=1 to create the commits."
  exit 0
fi

# Anything still uncommitted goes into one last commit on the final day
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  commit_at "${SLOTS[$((S - 1))]%% *} 23:45:00" "chore: final cleanup"
fi

echo "Done: $(git rev-list --count HEAD) commits from $START to $END."
echo
echo "Next steps:"
echo "  git log --pretty='%ad  %s' --date=format:'%a %d %b %H:%M' | less"
echo "  git remote add origin https://github.com/<you>/fullstack-estate.git"
echo "  git push -u origin main"
