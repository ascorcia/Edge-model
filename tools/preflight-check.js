#!/usr/bin/env node
/**
 * Preflight checker for Edge-model single-file app.
 * Purpose:
 * - Catch syntax/runtime regressions before shipping.
 * - Verify critical UI/data/interaction features still exist.
 *
 * This script does NOT modify product behavior.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = '/workspace';
const INDEX = path.join(ROOT, 'index.html');
const TMP_DOM = '/tmp/edge_preflight_dom.html';

function fail(msg) {
  console.error(`[preflight] FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`[preflight] OK: ${msg}`);
}

function readIndex() {
  if (!fs.existsSync(INDEX)) fail('index.html not found');
  return fs.readFileSync(INDEX, 'utf8');
}

function extractScripts(html) {
  // Remove HTML comments first so comment text like "<script> block"
  // does not get mistaken for a real script tag.
  const scrubbed = html.replace(/<!--[\s\S]*?-->/g, '');
  const scripts = [...scrubbed.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  if (!scripts.length) fail('no <script> blocks found');
  return scripts;
}

function checkSyntax(scripts) {
  scripts.forEach((s, i) => {
    try {
      new vm.Script(s);
    } catch (e) {
      fail(`script block ${i + 1} syntax error: ${e.message}`);
    }
  });
  pass(`script syntax (${scripts.length} blocks)`);
}

function renderDomSnapshot() {
  const chrome = 'google-chrome';
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=/tmp/edge-preflight-chrome',
    '--virtual-time-budget=15000',
    '--dump-dom',
    `file://${INDEX}`,
  ];
  const out = spawnSync(chrome, args, { encoding: 'utf8', timeout: 60000 });
  if (out.stdout) fs.writeFileSync(TMP_DOM, out.stdout);
  if (!fs.existsSync(TMP_DOM) || fs.readFileSync(TMP_DOM, 'utf8').length < 1000) {
    fail(`dom render failed (code=${out.status}, stderr=${(out.stderr || '').slice(0, 400)})`);
  }
  pass('headless DOM snapshot');
  return fs.readFileSync(TMP_DOM, 'utf8');
}

function mustContain(haystack, needle, label) {
  if (!haystack.includes(needle)) fail(`${label} missing (${needle})`);
  pass(label);
}

function checkCoreFeatures(html, dom) {
  // UI core
  mustContain(dom, 'id="scoreDateStrip"', 'scores day-strip');
  mustContain(dom, 'id="sidebarToggle"', 'sidebar semicircle toggle');
  mustContain(dom, 'id="picksManualRefreshBtn"', 'picks manual refresh button');
  mustContain(dom, 'id="picksContainer"', 'picks container');
  mustContain(dom, 'id="standingsContainer"', 'standings container');

  // Interactivity hooks
  mustContain(html, 'window.openGameById', 'score click open hook');
  mustContain(html, 'installGameInteractivity()', 'game interactivity installer');
  mustContain(html, 'manualRefreshPicks', 'manual picks refresh function');
  mustContain(html, 'installSidebarToggle()', 'sidebar toggle installer');

  // Critical system/log functions still present
  [
    'function renderBetLog(',
    'function renderReviews(',
    'function renderPasses(',
    'function renderFailures(',
    'function renderLearnings(',
    'function updateROI(',
    'function renderScores(',
    'function renderScoresFull(',
    'function renderStandingsView(',
  ].forEach((sig) => mustContain(html, sig, `core function ${sig}`));

  pass('core feature checks');
}

function main() {
  const html = readIndex();
  const scripts = extractScripts(html);
  checkSyntax(scripts);
  const dom = renderDomSnapshot();
  checkCoreFeatures(html, dom);
  console.log('[preflight] PASS: all checks green');
}

main();

