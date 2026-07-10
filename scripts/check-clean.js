#!/usr/bin/env node

/**
 * check-clean.js — fails the deploy if the git working tree is dirty.
 * Forces you to commit (or stash) all changes before pushing, so the
 * server always receives a intentional snapshot rather than half-edited
 * state.
 */

import { execSync } from "child_process";

try {
  const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
  if (status !== "") {
    console.error("❌ Working tree is not clean. Commit or stash your changes before deploying:\n");
    console.error(status);
    process.exit(1);
  }
} catch (e) {
  console.error("❌ Failed to check git status:", e.message);
  process.exit(1);
}
