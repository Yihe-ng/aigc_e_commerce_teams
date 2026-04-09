---
name: heroui-v3-install
description: >-
  Installs the official HeroUI v3 agent skill for Cursor from heroui.com via the
  published bash installer. Use when the user asks to install or update HeroUI
  v3 Cursor skills, heroui-react agent support, or to run the v3.heroui.com
  install script; also when setting up HeroUI v3 documentation for the AI in a
  new environment.
---

# HeroUI v3 — Install Cursor skill

## What this does

The official installer downloads the **heroui-react** skill tarball from HeroUI and extracts it into Cursor’s skills directory so the agent can use HeroUI v3 patterns and docs automatically.

## Command (default: heroui-react)

```bash
curl -fsSL https://v3.heroui.com/install | bash -s heroui-react
```

- Use `-fsSL` so curl fails on HTTP errors and follows redirects safely.

## Prerequisites

- **Shell**: `bash` with `curl` and `tar` (macOS/Linux, **Git Bash**, or **WSL** on Windows).
- **Cursor**: `~/.cursor` should exist (open Cursor at least once). If the script reports “No supported tools detected,” install/start Cursor first, then re-run.
- **Network**: Required to fetch `https://v3.heroui.com/install` and the skill archive from `heroui.com`.

## Other bundled skills

Pass a different name as the first argument to `bash -s`:

| Skill | Use case |
|-------|----------|
| `heroui-react` | HeroUI v3 for React (default) |
| `heroui-native` | HeroUI for React Native |
| `heroui-migration` | Migration-related skill |

Example:

```bash
curl -fsSL https://v3.heroui.com/install | bash -s heroui-native
```

## After install

- Cursor skill path: `~/.cursor/skills/<skill-name>/` (e.g. `heroui-react`).
- If upgrading from an old `heroui` skill, the installer may remove the legacy `heroui` skill and related command files when installing `heroui-react`.

## Agent behavior

When the user wants this installed, **run the command in the user’s environment** (or tell them to run it in Git Bash/WSL on Windows if a non-bash shell is active). Do not substitute an unofficial URL or manual unpack unless the official installer fails and the user agrees to troubleshoot.
