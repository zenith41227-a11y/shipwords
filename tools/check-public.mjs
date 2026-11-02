#!/usr/bin/env node
// Checks that this public repo carries no private identifiers: real-looking emails, analytics IDs, resource UUIDs,
// account IDs and live payment keys. Runs in CI over every tracked text file. An email on a site's own configured
// url host is public (the support and sender addresses new-site writes). Operators keep any other site-specific
// values outside this repo and scan with that list before pushing; this is the generic floor.
// Run: node tools/check-public.mjs [root]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSiteConfig, siteDirs, TOOLS_ROOT } from './lib.mjs';

const TEXT = /\.(ts|tsx|mjs|js|json|jsonc|md|html|css|txt|yml|yaml|toml|example|xml|svg)$/;
// Lockfile hashes, the disposable-domain list, test fixtures and drizzle snapshot IDs are not private data.
const SKIP = [
  /^pnpm-lock\.yaml$/,
  /disposable-domains\.gen\.ts$/,
  /(^|\/)test\//,
  /\.test\.(mjs|ts)$/,
  /migrations\/meta\//,
];
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net)|test|invalid|localhost|users\.noreply\.github\.com)$/;

/**
 * Hosts of site and template `url` values. A support or sender address on that host is the public
 * contact address `pnpm new-site` writes (it is rendered on the policy pages), not a leaked inbox.
 */
export function publicEmailHosts(root = TOOLS_ROOT) {
  const hosts = new Set();
  for (const site of siteDirs(root)) {
    const url = readSiteConfig(site.dir).url;
    if (!url) continue;
    try {
      hosts.add(new URL(url).hostname.toLowerCase());
    } catch {
      // A site url that is not a URL does not allow any email host.
    }
  }
  return hosts;
}

/** Each rule: a global pattern and an optional ok(match, relPath, hosts) that accepts known-public matches. */
const RULES = [
  // The host needs an alphabetic TLD, so package specifiers like pnpm@10.30.1 are not emails.
  {
    name: 'email address',
    pattern: /\b[\w.+-]+@([\w-]+(?:\.[\w-]+)*\.[a-z]{2,})\b/gi,
    ok: (m, _rel, hosts) =>
      PLACEHOLDER_HOST.test(m[1].toLowerCase()) || hosts?.has(m[1].toLowerCase()) === true,
  },
  {
    name: 'GA4 measurement ID',
    pattern: /\bG-[A-Z0-9]{8,12}\b/g,
    // The project website's own tag is public by nature.
    ok: (_, rel) => rel === 'apps/www/public/analytics.js',
  },
  {
    name: 'UUID (D1 database, account or deployment ID)',
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g,
    ok: (m) => m[0].startsWith('00000000-'),
  },
  { name: 'live payment key', pattern: /\b(?:sk|rk|pk)_live_[A-Za-z0-9]+|\bwhsec_[A-Za-z0-9]{20,}/g },
  { name: '32-hex ID (Cloudflare account or verification token)', pattern: /\b[0-9a-f]{32}\b/g },
];

/** Problems in one file's text, as "path:line: what". `hosts` are public site domains from publicEmailHosts. */
export function scanText(rel, text, hosts) {
  const problems = [];
  const lines = text.split('\n');
  for (const rule of RULES) {
    for (const [index, line] of lines.entries()) {
      for (const match of line.matchAll(rule.pattern)) {
        if (rule.ok?.(match, rel, hosts)) continue;
        problems.push(`${rel}:${index + 1}: ${rule.name} (${match[0]})`);
      }
    }
  }
  return problems;
}

export function isScanned(rel) {
  return TEXT.test(rel) && !SKIP.some((pattern) => pattern.test(rel));
}

/** Scans every tracked text file under root. */
export function checkPublic(root = TOOLS_ROOT) {
  const files = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter((rel) => rel && isScanned(rel));
  const hosts = publicEmailHosts(root);
  const problems = [];
  for (const rel of files) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    problems.push(...scanText(rel, fs.readFileSync(full, 'utf8'), hosts));
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : TOOLS_ROOT;
  const problems = checkPublic(root);
  if (problems.length) {
    console.error(`Private-looking values in the public repo (${root}):\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log('check-public: no private-looking values in tracked files.');
}
