#!/bin/bash
# PreToolUse(Bash) guardrail. Reads the hook JSON on stdin; exit 2 blocks.
# A plain `git push` stays allowed (the /commit-push-pr flow needs it).
# This is a pattern match on the command text: a safety net, not a boundary.

COMMAND=$(jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

block() {
	echo "BLOCKED: '$COMMAND' ($1). Ask the user to run it themselves if it is really intended." >&2
	exit 2
}

# git <opts> <sub> ...: allow global options such as -C <dir> before the subcommand.
G='git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|-c[[:space:]]+[^[:space:]]+|--[a-z-]+(=[^[:space:]]+)?))*[[:space:]]+'

# Force push: --force*, -f (also bundled like -fu), or a +refspec. Stays inside one command.
echo "$COMMAND" | grep -Eq "${G}push[[:space:]]+([^;&|]*[[:space:]])?(--force[^[:space:]]*|-[a-zA-Z]*f[a-zA-Z]*|\+[^[:space:]]+)([[:space:]]|\$|;|&|\|)" &&
	block "force push"
echo "$COMMAND" | grep -Eq "${G}reset([[:space:]].*)?[[:space:]]--hard" && block "reset --hard"
echo "$COMMAND" | grep -Eq "${G}clean([[:space:]].*)?[[:space:]]-[a-zA-Z]*f" && block "clean -f"
echo "$COMMAND" | grep -Eq "${G}clean([[:space:]].*)?[[:space:]]--force" && block "clean --force"
echo "$COMMAND" | grep -Eq "${G}branch([[:space:]].*)?[[:space:]]-[a-zA-Z]*D" && block "branch -D"
# Whole-tree discard: a bare `.` or `:/` pathspec (a subpath such as ./src/x is fine).
# `restore --staged .` only unstages, so it passes unless --worktree/-W is also given.
TREE="${G}(checkout|restore)([[:space:]].*)?[[:space:]](\.|:/)([[:space:]]|\$|;|&|\|)"
if echo "$COMMAND" | grep -Eq "$TREE"; then
	if echo "$COMMAND" | grep -Eq "${G}restore " &&
		echo "$COMMAND" | grep -Eq "[[:space:]](--staged|-S)([[:space:]]|\$)" &&
		! echo "$COMMAND" | grep -Eq "[[:space:]](--worktree|-W)([[:space:]]|\$)"; then
		exit 0
	fi
	block "discards the whole working tree"
fi

exit 0
