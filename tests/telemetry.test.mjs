// Unit tests for the pure parts of worker/telemetry.js. Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OPT_IN_REGIONS,
  bannerState,
  beaconVerdict,
  channelOf,
  dcOf,
  isPageLoad,
  measureRule,
  networkOf,
  pageClass,
  sessionDelta,
} from "../worker/telemetry.js";

const EU27 = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];

test("region list: the EU, the rest of the EEA, the UK and Switzerland are opt-in", () => {
  for (const c of [...EU27, "IS", "LI", "NO", "GB", "CH"]) {
    assert.ok(OPT_IN_REGIONS.has(c), c);
    assert.equal(measureRule(c, "regional"), "opt-in", c);
  }
});

test("region list: elsewhere is opt-out under the regional policy", () => {
  for (const c of ["US", "CA", "IN", "BR", "AU", "JP", "NG", "MX", "PH", "ZA"]) assert.equal(measureRule(c, "regional"), "opt-out", c);
});

test("region list: an unknown country is opt-in", () => {
  for (const c of [null, undefined, "", "XX", "T1", "us", "USA", 42]) assert.equal(measureRule(c, "regional"), "opt-in", String(c));
});

test("any policy but regional keeps opt-in everywhere", () => {
  for (const policy of [undefined, "", "opt-in-everywhere", "Regional"]) assert.equal(measureRule("US", policy), "opt-in", String(policy));
});

test("banner state accepts the three states and nothing else", () => {
  assert.equal(bannerState("granted"), "granted");
  assert.equal(bannerState("denied"), "denied");
  assert.equal(bannerState("unset"), "unset");
  for (const v of [undefined, null, "", "yes", true, 1]) assert.equal(bannerState(v), null);
});

test("beacon verdict: decline and GPC win everywhere", () => {
  for (const rule of ["opt-in", "opt-out"]) {
    for (const c of ["granted", "denied", "unset", null]) assert.equal(beaconVerdict(rule, c, true), "gpc", `${rule} ${c}`);
    assert.equal(beaconVerdict(rule, "denied", false), "declined", rule);
  }
});

test("beacon verdict: opt-in regions need an accept", () => {
  assert.equal(beaconVerdict("opt-in", "granted", false), "ok");
  assert.equal(beaconVerdict("opt-in", "unset", false), "consent");
  assert.equal(beaconVerdict("opt-in", null, false), "consent"); // a tracker too old to say
});

test("beacon verdict: opt-out regions take everything but a decline", () => {
  assert.equal(beaconVerdict("opt-out", "granted", false), "ok");
  assert.equal(beaconVerdict("opt-out", "unset", false), "ok");
  assert.equal(beaconVerdict("opt-out", null, false), "ok");
});

test("data-centre flag", () => {
  assert.equal(dcOf(16509), 1); // AWS
  assert.equal(dcOf(14061), 1); // DigitalOcean
  assert.equal(dcOf(7922), 0); // Comcast
  assert.equal(dcOf(13335), 0); // Cloudflare, which includes WARP users
  assert.equal(dcOf(undefined), 0);
  assert.equal(dcOf("16509"), 0);
});

test("page class: bots by user agent first, then data centres", () => {
  const chrome = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
  assert.equal(pageClass(chrome, 7922), "human");
  assert.equal(pageClass(chrome, 16509), "dc");
  assert.equal(pageClass("Mozilla/5.0 (compatible; Googlebot/2.1)", 15169), "bot");
  assert.equal(pageClass("", 7922), "bot");
});

test("page loads: HTML 200s and revalidated pages, never prefetches", () => {
  assert.equal(isPageLoad("GET", 200, "text/html; charset=utf-8", "text/html", null), true);
  assert.equal(isPageLoad("GET", 304, null, "text/html,application/xhtml+xml", null), true);
  assert.equal(isPageLoad("GET", 304, null, "image/avif,image/webp", null), false);
  assert.equal(isPageLoad("GET", 200, "image/svg+xml", "*/*", null), false);
  assert.equal(isPageLoad("HEAD", 200, "text/html", "text/html", null), false);
  assert.equal(isPageLoad("GET", 404, "text/html", "text/html", null), false);
  assert.equal(isPageLoad("GET", 200, "text/html", "text/html", "prefetch"), false);
  assert.equal(isPageLoad("GET", 200, "text/html", "text/html", "prefetch;prerender"), false);
});

const view = (over = {}) => ({ ts: 1000, type: "view", path: "/a/", nav: "navigate", ref: null, src: null, ...over });

test("session delta: one quick view is not engaged", () => {
  const d = sessionDelta("cb", [view(), { ts: 4000, type: "leave", ms: 3000, c: 0 }]);
  assert.equal(d.engaged, 0);
  assert.equal(d.views, 1);
  assert.equal(d.active, 3000);
  assert.equal(d.entry, "/a/");
  assert.equal(d.channel, "direct");
});

test("session delta: an engaged event, a second view, a click or 10 s make it engaged", () => {
  assert.equal(sessionDelta("cb", [view(), { ts: 2000, type: "engaged" }]).engaged, 1);
  assert.equal(sessionDelta("cb", [view(), view({ ts: 2000, path: "/b/" })]).engaged, 1);
  assert.equal(sessionDelta("cb", [{ ts: 2000, type: "leave", ms: 500, c: 1 }]).engaged, 1);
  assert.equal(sessionDelta("cb", [{ ts: 2000, type: "leave", ms: 10_000, c: 0 }]).engaged, 1);
});

test("session delta: nothing stored, nothing added", () => {
  assert.equal(sessionDelta("cb", []), null);
});

test("session delta: NetDrill's last place is the last lab opened", () => {
  const d = sessionDelta("nd", [view({ path: "/" }), { ts: 2000, type: "open", item: "ospf-1" }, { ts: 3000, type: "open", item: "vlan-2" }]);
  assert.equal(d.exit, "vlan-2");
  assert.equal(d.opens, 2);
});

test("networks: IPv4 as is, IPv6 by its /64", () => {
  assert.equal(networkOf("203.0.113.7").key, "v4:203.0.113.7");
  assert.equal(networkOf("::ffff:203.0.113.7").key, "v4:203.0.113.7");
  assert.equal(networkOf("2001:db8:1:2:aaaa::1").key, "v6:2001:0db8:0001:0002::/64");
  assert.equal(networkOf("2001:db8:1:2:bbbb:cccc:dddd:eeee").key, networkOf("2001:db8:1:2::9").key);
  assert.equal(networkOf("999.1.1.1"), null);
  assert.equal(networkOf("not an ip"), null);
});

test("channels", () => {
  assert.equal(channelOf(null, null), "direct");
  assert.equal(channelOf("google.com", null), "search");
  assert.equal(channelOf("google.co.uk", null), "search");
  assert.equal(channelOf("chatgpt.com", null), "ai");
  assert.equal(channelOf("reddit.com", null), "social");
  assert.equal(channelOf("netdrill.certblueprint.com", null), "cross-site");
  assert.equal(channelOf("example.org", "newsletter"), "campaign");
  assert.equal(channelOf("example.org", null), "referral");
});
