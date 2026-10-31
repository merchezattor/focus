#!/bin/bash
# PostToolUse(Edit|Write): run Biome on the edited file only.
# Safe fixes and formatting are applied in place. If errors remain, exit 2
# sends Biome's output to the agent so it fixes them.

FILE=$(jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] || [ ! -f "$FILE" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x node_modules/.bin/biome ] || exit 0

OUT=$(node_modules/.bin/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true "$FILE" 2>&1)
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
	echo "$OUT" >&2
	exit 2
fi
exit 0
