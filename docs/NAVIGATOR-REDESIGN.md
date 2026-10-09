# The IT Career Navigator — redesign

How the Navigator works, why it works that way, and what to do next. Written for
whoever maintains this after me.

---

## 1. Critique of what was there

The previous Navigator lived in `public/navigator-app.html`: 1,272 lines of
inline CSS and vanilla JS, embedded into `/navigator/` through an iframe with
postMessage plumbing for height and theme. It had four problems, in increasing
order of severity.

**It was outside the application.** Not typed, not linted, not testable, not
reusable, and its data could never be shared with the rest of the site. The
scoring weights and the certification links were a second, drifting copy of
information the content collections already held.

**It asked abstract self-report questions.** `slider`, `choice`, `forced`,
`rank6`, `constraint`, `confidence`, `negative` — every type was a variation on
"how much do you enjoy X". *"You're planning a trip with a group of friends. What
role do you naturally fall into?"* is a personality quiz in IT clothing. It
measures self-image, not attraction to work.

**It asked people to self-assess fields they had never seen.** The whole reason
someone takes a career tool is that they do not yet know what a SOC analyst does.
Asking them to rate their interest in it produces an answer about their
stereotype of the field.

**Its data model made the right answer unrepresentable.** This is the fatal one.
21 path codes were collapsed through a `C2F` map into 10 flat, mutually exclusive
families (`SUP/NOC/SYS/CLD/DEV/QA/DAN/SEC/BIZ/FLD`). `SEC` was one bucket for SOC,
GRC, IAM, DFIR and pentest — five unrelated temperaments. And because families
were exclusive, **"Network Security Engineer" could not exist as an output.**

That last point explains the reported symptom directly. Someone with 15–20 years
across networking and security has signal in both; the model had to route it into
`NOC` *or* `SEC`, and the intersection that actually describes them was discarded
by the data structure before scoring ever ran. The test was not badly tuned. It
was structurally incapable of producing the correct answer.

---

## 2. Product architecture

Three connected surfaces, one shared graph.

```
                    ┌───────────────────────────────────┐
                    │      /navigator/  (the hub)       │
                    └───┬─────────────┬─────────────┬───┘
                        │             │             │
              ┌─────────▼───┐  ┌──────▼──────┐  ┌───▼──────────┐
              │  EXPLORE    │  │ FIND MY PATH│  │  INVENTORY   │
              │  the map    │  │  scenarios  │  │ already in IT│
              └─────────┬───┘  └──────┬──────┘  └───┬──────────┘
                        │             │             │
                        └─────────────┼─────────────┘
                                      ▼
                        ┌─────────────────────────────┐
                        │  domain → role → cert graph │
                        │  technology → capability ↗  │
                        └─────────────────────────────┘
```

The three modes are genuinely different doors, not a funnel. Explore works with
no assessment. The assessment works with no inventory. The inventory works on its
own and produces a useful answer by itself.

**Layering rule, enforced by directory:** `data/` knows nothing about scoring,
`engine/` knows nothing about the DOM, `ui/` and `components/` know nothing about
weights. You can rewrite the entire interface without touching a scoring line.

---

## 3. User journey

**"I want to get into IT and have no idea what I want to do."**

1. Lands on `/navigator/`. Reads three sentences that do not ask them to know
   anything. Sees seven domain cards — each showing real role names, so
   *Network Security Engineer* is visible under both Networking and
   Cybersecurity before a word of explanation.
2. Takes **Find my path**. Eight broad scenarios: a 2 AM outage, a firewall log
   line, a server at 98% memory. Every unfamiliar term has a one-click plain
   English explainer that does not submit an answer.
3. The system detects contested dimensions and asks 3–10 differentiating
   scenarios instead of a fixed remainder.
4. Results: ranked matches with honest confidence, "why these appeared" built
   from their actual choices, the interest pattern underneath, and any
   intersection they are sitting on.
5. Clicks through to a role page: what you do → technologies → concepts →
   environments → enjoy-if → **the honest downside** → where it leads →
   *then* certifications.
6. Certification pages are the existing `/vendors/…` guides. Nothing was rebuilt.

**"I already work in IT."** Straight to `/navigator/inventory/`, tick the tools
they have used, and see the capabilities and fields their experience actually
spans — then optionally take the scenarios, seeded by that inventory.

---

## 4–6. Information architecture, domain and role taxonomy

```
/navigator/                          hub
/navigator/explore/                  full map + first-job roles + intersections
/navigator/explore/[domain]/         7 pages, subdomains + roles + overlap callout
/navigator/roles/[role]/             38 pages
/navigator/assessment/               adaptive scenario engine
/navigator/results/                  client-rendered from session state
/navigator/inventory/                technology → capability analysis
/navigator/technologies/             the technology→capability→role graph
/navigator-lab                       PRESERVED — the AI conversational entry
/paths/…  /vendors/…  /compare/…     PRESERVED — untouched
```

**Seven domains**, deliberately not twenty: Networking, Cybersecurity, Systems &
Infrastructure, Cloud, Software & Automation, Data, Support & Operations. The
long tail (network automation, OT security, forensics, platform engineering)
lives in **45 subdomains** so the first screen stays legible without dropping
anything.

**38 roles.** A role is listed under *every* subdomain it genuinely belongs to.
25 of the 38 span more than one domain, and that overlap is the product:

| Combination | Produces |
|---|---|
| Networking + Cybersecurity | Network Security Engineer, Zero Trust Engineer, OT/ICS Security Engineer |
| Cloud + Cybersecurity | Cloud Security Engineer, DevSecOps Engineer |
| Systems + Cybersecurity | Identity Engineer, Security Engineer |
| Networking + Software | Network Automation Engineer |
| Data + Cybersecurity | Detection Engineer, Threat Hunter |
| Cloud + Networking | Cloud Network Engineer |

---

## 7. Technology → capability model

```
TECHNOLOGY ──▶ CAPABILITY ──▶ DOMAIN ──▶ ROLE ──▶ CERTIFICATION
```

The middle layer is the point. A technology is a product that comes and goes; a
capability is what you can do, and it survives the product. So Forescout does not
map to "Network Security Engineer" — it maps to seven capabilities, and the role
match falls out of the accumulated capability set. That is why it still works
when someone changes vendors, and why it can surface a role no single tool on the
list would have suggested.

**49 technologies, 55 capabilities.** Example:

```
Forescout ─┬─▶ Network Access Control ────┐
           ├─▶ Device Discovery/Profiling ├─▶ Cybersecurity ─┬─▶ Network Security Engineer
           ├─▶ Endpoint Posture           │   Networking     ├─▶ Zero Trust Engineer
           ├─▶ Policy Enforcement         │                  ├─▶ OT Security Engineer
           ├─▶ Segmentation               │                  └─▶ Identity Engineer
           ├─▶ Continuous Monitoring      │                        │
           └─▶ Zero Trust Enforcement ────┘                        ▼
                                                       Security+ · CySA+ · CCNP Security
```

Each of the 19 requested technologies carries a `revelation` line — the "you may
have more of this than you realise" statement. These are the highest-value copy
in the feature.

---

## 8–9. Assessment and adaptive algorithm

**41 scenarios**: 19 broad, 22 differentiators. Five micro-simulation types
(`topology`, `log`, `metrics`, `terminal`, `ticket`) render actual artefacts —
a firewall log with a 487 MB transfer, a host at 98% memory, a five-hop path with
one node failing.

Authoring rules, enforced by review:

1. The setup never names a career, a domain, or a job title.
2. **No option is objectively correct.** Every one is something a competent
   professional might genuinely choose first.
3. Options are matched in length and confidence — an option that sounds more
   expert than its neighbours is a leading question.
4. Unfamiliar terms get a glossary key, never a rewrite into vagueness. We want
   people able to choose *real* work.
5. Frames vary. Asking "what would you investigate first?" nineteen times trains
   people to answer the format.

**Phase 1 — breadth (8 scenarios).** Ordered greedily to maximise *domain
coverage*, with diminishing returns on domains already covered and a penalty for
repeating a recent category.

> This replaced naive category rotation after testing found a real bug. Phase 2
> only unlocks a cloud question once cloud signal exists — so if the first eight
> scenarios happened to offer little cloud work, a cloud-shaped person could
> never build enough signal to be asked, and the tool confidently concluded they
> were something else. A chicken-and-egg fault that surfaces only as a *plausible
> wrong answer* is the worst kind.

**Phase 2 — discrimination.** For each eligible unanswered scenario, simulate
every option: what would the top role be if they picked it? A scenario where all
options lead to the same leader teaches nothing. One where different options
produce different leaders is exactly the question worth asking. Ties break on
score spread.

Greedy one-step lookahead, not true information gain — within a rounding error
for a bank this size, and something a maintainer can read.

**Eligibility.** A differentiator fires only when the user shows signal in at
least half its trigger dimensions. Someone with no security signal is never asked
to choose between detection and prevention, because whichever they picked would
be noise.

**Stopping.** Three conditions, whichever comes first:
- Leader is clear (≥11 answers, ≥4 percentage points, ≥60% group coverage)
- **Exhaustion** — the best remaining question could not change the leader
- Hard cap at 18

Never a fixed length. A sharp profile finishes in 11; dragging them to 20 teaches
them to guess at what the tool wants.

**Back reviews, it does not delete.** Going back re-displays an earlier question
with the original choice still selected, because seeing what you picked is what
lets you judge whether to change it. Changing that answer then discards every
question after it — those were selected adaptively *on the basis of the answer
being changed*, so they are no longer questions the engine would have asked. The
first implementation deleted the answer on Back instead, which silently lost the
selection; it was caught in browser testing, not by the type checker.

**"None of these appeal to me"** is always available. Without it, someone with no
interest in any option must pick one anyway, and that forced pick is recorded as
genuine attraction. The scenario still counts toward exposure, so "offered this
four times, wanted none of it" scores as the negative signal it is.

---

## 10–11. Scoring and role matching

**Model: group-weighted cosine similarity over exposure-normalized vectors.**

41 dimensions in 5 groups — domain (8), problem style (9), abstraction (8),
security affinity (9), work style (7). Users and roles are vectors over the same
axes, which is what makes them comparable. Roles are authored **sparse**: list
only what genuinely describes the role.

### Why cosine

- **Not raw weighted totals.** They reward answering more questions, and reward
  roles whose vectors happen to be dense — a role authored with 25 dimensions
  would beat one with 15 for reasons purely about data entry.
- **Not Euclidean distance.** It penalises a user for having weaker overall
  signal than an idealised role profile. Someone who answered eleven questions
  has a smaller vector than the Network Security Engineer profile *by
  construction* — but their **shape** can match perfectly. Direction is what we
  mean by "this kind of work attracts you".
- **Group weights** apply as √w on both vectors, so it stays a true cosine while
  letting domain affinity (1.0) outweigh work-rhythm preference (0.45). Security
  is deliberately light (0.55): it only means anything for people who showed
  security interest, and over-weighting would drag everyone toward security roles
  for answering one firewall question.

### Exposure normalization — the correction that mattered most

Measuring the finished bank found options carrying **cybersecurity weight
outnumbered cloud ones roughly 6:1**, purely because security scenarios are more
fun to write. Under group-max normalization that authoring skew *becomes the
result*: everyone drifts to security, and a genuinely cloud-shaped person cannot
register it. Precisely the original failure, reintroduced by a different route.

So we normalize against **opportunity**, not against other dimensions:

```
normalized[d] = raw[d] / (exposure[d] + PRIOR)

exposure[d] = Σ over shown scenarios of (best available weight for d)
PRIOR = 3
```

Not "how big is your networking score relative to your other scores" but **"of
the chances you were given to choose networking work, how many did you take."**
A rarely-offered dimension is no longer punished for being rarely offered, and
the metric self-corrects as content changes — no recalibration pass, no
per-dimension magic constants.

`PRIOR` is Bayesian shrinkage toward zero. Without it, a dimension offered once
and taken once scores a perfect 1.0 off a single click. With it, one lucky pick
reads as moderate interest and ten consistent picks read as strong interest —
which is what those two things actually mean.

### Display percentage

Cosine over these vectors lands between ~0.30 (unrelated) and ~0.95 (genuinely
close). That band maps onto 0–100, so an unrelated role reads ~0% rather than
~45%, and **nothing ever reads 100%** — no real person is a perfect instance of a
job profile.

### Confidence

Margin is measured in the units the user sees. A gap the page renders as "84% and
81%" must not be called decisive by internal maths the reader cannot access.
Near-ties are stated as near-ties, and low signal says so instead of inventing a
number.

### Intersections

Flagged when a role spans ≥2 domains **and** the user shows ≥0.55 normalized
signal in both. Without the second condition every multi-domain role gets the
label and it means nothing.

### Validation

A persona harness drives the real engine end to end, with fair tie-breaking (
always taking the first option would measure authoring order, which is not
neutral):

| Persona | Top match | Q | Confidence |
|---|---|---|---|
| **Networking + security veteran** | **Network Security Engineer 88%** *(intersection)* | 11 | high |
| Pure networking | Network Engineer 81% | 15 | high |
| Detection / investigation | SOC Analyst 70% | 18 | moderate |
| Automation-first | DevOps Engineer 82% | 16 | high |
| Systems | Systems Administrator 88% | 11 | high |
| Support / people-facing | Help Desk Technician 86% | 18 | moderate |
| Data | Data Analyst 82% | 11 | high |
| Identity | Identity Engineer 74% | 13 | high |
| Cloud + security | **Cloud Security Engineer 69%** | 13 | high |
| Architecture-minded | Security Architect 78% | 17 | high |

Inventory alone (IOS + BGP + FortiGate + Forescout + ISE) → **cybersecurity 100%,
networking 85%**, top role Network Security Engineer 82%. The "you have more
security experience than your title says" claim demonstrably works.

The cloud+security persona was the weakest result and has since been fixed. The
cause was measurable and specific: **exactly one option in the entire bank of 157
carried both `dom.cloud` and `dom.cybersecurity` weight**, and the two most
obviously cloud-security options ("audit the permissions", "check the traffic is
legitimate") were weighted as security-only. Cloud Security Engineer's vector is
cloud 10 + cyber 10, so it was unreachable by construction — the same class of
fault as the original test's collapsed families, in miniature.

Fixed by correcting those weights and adding `d23-leaked-key`, a differentiator
where every option is genuinely both cloud and security and they separate the
sub-specialisations from each other rather than from "not security". Cloud
Security Engineer went from 4th at 61% to **1st at 69%**, cloud domain signal from
29 to 48, and the run shortened from 18 questions at moderate confidence to 13 at
high.

---

## 12. Data schema

TypeScript modules under `src/lib/navigator/data/`, not content collections —
the engine needs this data at runtime in the browser, and collections are
server-only. Fully typed via `src/lib/navigator/types.ts`.

```
Domain      1─n Subdomain
Subdomain   n─n Role            (a role appears under every subdomain it fits)
Role        n─n Domain          (ordered; [0] is primary)
Role        1─n RoleCert ───────▶ certifications collection (existing pages)
Role        1─n AdjacentRole ───▶ Role   (the career graph)
Role        1─1 Vector          (sparse, over 41 DimensionIds)
Role        0─1 pathSlug ───────▶ paths collection (existing roadmaps)

Technology  n─n Capability
Technology  n─n Domain, n─n Role, n─n Certification
Capability  n─n Domain, n─n Role
Capability  1─1 Vector

Scenario    1─n ScenarioOption
ScenarioOption 1─1 Vector       (affects many dimensions)
Scenario    0─1 SimBlock        (5 discriminated-union kinds)
Scenario    0─n triggers        (DimensionIds gating differentiators)
```

`assertRoleGraphIntegrity()` runs at build time from the hub page — a mistyped
role slug anywhere in the graph **fails the build** rather than shipping a dead
link.

---

## 13. Component architecture

```
src/lib/navigator/
  types.ts                    all entities, no imports
  data/  dimensions · domains · capabilities · technologies · glossary
         roles/       cores  ← identity + vector, the ONLY role data sent to a browser
                      networking · security · systems-cloud · software-data-ops
                                 ← page prose, server-side only
                      index  ← merges the two, asserts they line up
         scenarios/   broad · differentiators · index
  engine/ vector · scoring · adaptive · session · inventory      (no DOM)
  ui/     render · results                                       (DOM, no weights)

src/components/navigator/
  DomainCard · RoleCardCompact · RoleProfile · ScoreBar · TermTip

src/styles/navigator.css      builds on the existing --cb-* tokens
```

No new dependencies. No UI framework. The site had none and did not need one.

---

## 14–16. Results, explorer, inventory

**Results** (`/navigator/results/`) — confidence first, then ranked matches with
animated bars, intersection callouts, "why these appeared" built verbatim from
the rationale of options the user actually chose, the five-group interest
pattern, and next steps. Framing rule throughout: **describe attraction, never
identity.** "Your responses show a strong pull toward X", never "you are an X".

**Explorer** — domain map → subdomains → roles → role profile, with an explicit
"roles that live here *and* somewhere else" panel on every domain page.

**Inventory** — 49 technologies filterable by name and alias, restored from
localStorage. Output leads with the revelations, then capabilities (with which
tools evidence each), fields spanned, implied roles, and a route into the
scenarios.

---

## 17–19. Content inventory

- **41 scenarios** with full weights and per-option rationale
  (`data/scenarios/`), exceeding the 30 requested.
- **38 role profiles** including all ten requested, each with all nine required
  sections plus an honest downside.
- **49 technology mappings** including all nineteen requested, each with
  capabilities, domains, roles and certifications; the requested nineteen also
  carry `revelation` copy.

---

## 20–22. Implementation, state, storage

State is three plain modules' worth of functions over Web Storage — no store, no
framework, no reactivity system. It did not need one.

| Storage | Holds | Lifetime | Why |
|---|---|---|---|
| `sessionStorage` | in-progress answers | tab | Survives refresh and back-navigation; gone when the tab closes. The right default for something this personal. |
| `localStorage` | saved result, inventory, explore history | until cleared | **Only ever written as the result of a click**, never as a side effect. |
| memory `Map` | fallback | page | Private browsing still works end to end; it just does not survive a refresh. |

Explore history is capped at 20, surfaced on the results page as an *observation*
("separately, you read about these — this is not counted in the scores"), and has
its own one-click Forget. `clearEverything()` wipes all four keys.

**Privacy:** no account, no server call, no identifier, no telemetry added. The
assessment posts nothing. The existing sitewide GTM/GA/AdSense tags are
untouched — but the Navigator adds no events of its own and none of the answers
or results are exposed to them.

---

## 22b. Weekend trials

A match percentage is a hypothesis. A trial is the cheap experiment that tests
it, and it sits on the role page **between the honest downside and the
certifications** — deliberately in front of the part that asks people to spend
money.

**12 trials, 70 steps, covering all 38 roles** — every role page shows at least
two, after the tag repair in section 22j. They attach to *capabilities*,
not job titles, which is why twelve of them reach thirty-eight roles: one trial
about reading logs serves the SOC analyst, the incident responder, the forensics
analyst and the systems engineer at once, and it keeps working when the role
taxonomy shifts.

| Trial | Covers |
|---|---|
| Follow a packet | networking, network security, SOC, NOC, incident response |
| Read your own logs | SOC, IR, forensics, network security, systems |
| Make the computer do it | DevOps, network automation, systems, SOC |
| Declare it, preview it, destroy it | cloud, platform, SRE, DevOps |
| Fix someone's problem | help desk, systems admin, field, security engineering |
| Ask data a question | data analysis, data engineering, DBA, detection |
| Audit your own access | identity, Zero Trust, cloud security, GRC, architecture |
| Find what's exposed | penetration testing, vulnerability management, threat hunting, OT |
| Write a detection | detection engineering, threat hunting, SIEM |
| Break your own app | application security, software development, DevSecOps |
| Design it on paper | security architecture, cloud architecture, segmentation, risk |
| Walk the physical layer | wireless, data centre, field infrastructure |

### Rules, enforced at build time

`assertTrialIntegrity()` runs from the trials page, so a regression fails the
build rather than shipping. It requires every trial to be free, local, at least
four steps, and to carry both halves of the reflection — and it requires a
**safety scope on every single one**.

That last rule earned its place immediately: when the check was first run it
caught three of my own trials that touched someone else's device, network or
data with no scope note. Content review catches that inconsistently. A check
does not. The guard was then verified by deliberately removing a safety field
and confirming the build fails.

### Why every trial is free and local

No account, no credit card, no third-party free tier. The infrastructure-as-code
trial deliberately uses Terraform's *local* provider rather than a real cloud
account: every "learn cloud" tutorial that has you sign up with a card risks
leaving something running and billing you months later, which is a genuinely
common and expensive beginner experience and completely unnecessary for learning
the plan/apply/destroy loop.

### Safety is not boilerplate

Scope notes sit **above** the steps, never below, so anyone who skims and starts
has already passed them. The reconnaissance trial permits exactly one external
target — `scanme.nmap.org`, which the Nmap Project publishes for this purpose —
and states plainly that unauthorised scanning is a criminal offence and that
curiosity is not a defence. The support trial forbids asking for someone's
password. The application security trial is a file on your own desktop.

### Disliking it is a result

Every trial ends with two columns of equal weight: "This suits you if…" and
"If you disliked it". The second is not a consolation — it redirects. The
automation trial says plainly that if fighting syntax was pure frustration,
DevOps will be that repeatedly, and points toward architecture or operations
instead. A tool that only celebrates matches is an advertisement.

### Client cost: zero

Trials are server-rendered only. The client bundle is byte-identical at 28 KB
brotli with twelve trials as it was with none. `data/roles` and `data/trials`
must never be imported from anything that runs in a browser.

---

## 22c. Pay

Pay is the thing people are most often misled about, and almost always in the
flattering direction. The panel sits on the role page **immediately after the
honest downside and before the certifications** — grouped with the other reality
checks rather than next to the part that asks for money.

### Three bases, stated on the page

Every role declares where its number comes from, and the page says so in the
label rather than burying it in a footnote.

| Basis | Roles | What the page shows |
|---|---|---|
| `bls-direct` | 10 | A real published median plus its occupation title and SOC code |
| `bls-adjacent` | 11 | The nearest occupation's median, flagged as covering a different set of jobs |
| `no-official-category` | 17 | **A directional band only** — no median, no borrowed figure |

**Seventeen of thirty-eight roles have no official occupation at all.** There is
no BLS category for Zero Trust Engineer, Detection Engineer or DevSecOps
Engineer. The honest response is to say that on the page and show a range, not to
attach a precise-looking dollar figure to make the site look authoritative. The
Zero Trust page goes further and says the *job title itself* is used
inconsistently across employers, so any quoted figure — including this one —
deserves scepticism.

### Anchors, not 38 hand-written numbers

Ten `BLS_ANCHORS` carry the citable medians, SOC codes, titles and growth
outlooks. Roles reference an anchor and add their own entry figure, note and
caveats. When BLS republishes each spring, that is **ten numbers to update, not
thirty-eight scattered through role files** — which is the difference between the
data staying current and quietly rotting.

A directional band on the role overrides the anchor median, so a
`no-official-category` role never inherits a number it cannot justify.

### Rules, enforced at build time

`assertSalaryIntegrity()` runs from the navigator index alongside the role-graph
check, so a regression fails the build:

- **Every role has an entry.** No silent omissions.
- **Entry pay is never absent, and never subordinate to the median.** Quoting a
  midpoint at a career-changer without what they would actually start on is the
  standard way career sites mislead. Help Desk shows `$60,340 median` beside
  `$38,000–$47,000 to start`.
- **A role claiming an official mapping must cite an occupation** that resolves
  to a real anchor.
- **A `no-official-category` role must carry its own directional band** — verified
  by deliberately stripping one and confirming the build dies.
- **No orphan salary entries**, and **no unused anchors**. A published figure with
  no page behind it goes stale and then gets copied on the assumption someone was
  maintaining it. That check immediately caught SOC 15-1211, defined and never
  referenced; it was removed.

### What every panel carries

Source, release date (`BLS OES, May 2024 release`), and a statement that figures
are US national and **not** cost-of-living adjusted — plus an explicit line that
CertBlueprint earns nothing from salaries and no role is ranked, recommended or
presented more favourably because of what it pays. That line matters precisely
*because* the site runs affiliate links elsewhere.

### Client cost: zero

Salary is server-rendered only. The client bundle is byte-identical at 28,110
brotli with the salary system as it was without it.

---

## 22d. Routing the conversational lab into the graph

`/navigator-lab` is the other way in: one open question, answered in your own
words, read by a language model on a Worker. It was the only surface on this
site where a model's guess reached the user unmediated — it named fields that
may or may not have pages, and it **invented the weekend project**, with no
safety scope, on a site where every other trial has one.

The split now is: **the model writes the prose, the site owns the facts.**

### A closed vocabulary

Every reading must carry a `field_key` from a fixed list of 22. The prose is
still the model's own, but the key is what the page resolves against
`data/lab-fields.ts` → real role pages, a real trial. The worker drops a key it
does not recognise rather than passing it through, because an invented key and
an unmapped one would be indistinguishable downstream.

Twenty-five persona probes against the live endpoint returned **25 valid keys
and zero missing ones**, reaching all 22 keys — including every deliberately
unmapped field.

One real miss surfaced: a textbook QA answer ("I break things by using them
wrong on purpose and write down exactly how to reproduce it") routed to
offensive security. That is not a cosmetic error — offensive security is a
gated, late-career field and a bad place to send someone describing careful bug
reproduction. The prompt now separates *breaking software to document defects*
from *breaking systems to prove they can be compromised*, and an explicit QA
answer now lands correctly. The deliberately ambiguous phrasing still leans
offensive, which is left alone: tuning it further would start dragging genuinely
pentest-curious people into QA.

### Three build-time guards

- **Key drift.** The worker holds its own copy of the list, because that is
  where the model reads it. `pages/navigator/lab-graph.json.ts` reads the worker
  source at build time and fails if the two lists differ. Without this, drift
  degrades every reading to the unlinked fallback — which looks like the feature
  simply not working, and nothing would have pointed at the cause.
- **Reachability.** Every one of the 38 roles must be named by at least one
  field key. A role nobody can arrive at from the lab is invisible to everyone
  who chose the conversation over the questionnaire, and no other check in the
  codebase would ever notice.
- **Honesty of coverage.** A field claiming `covered` must name roles; a field
  that is not covered must carry a written explanation of the gap.

Both were verified by deliberately breaking them and confirming the build dies.

### Saying "we don't map this"

Four keys — AI/ML, project management, business analysis, technical writing —
resolve to `track: 'none'`. The page then says so **in the site's own voice**,
rather than trusting a model to volunteer a gap it has every incentive to paper
over, and points outward (PMI, IIBA) instead of deflecting to something
convenient. AI/ML still lists data engineering and platform engineering, because
those are the routes people actually take.

Where no checked trial exists, the model's suggestion is still shown — and
labelled *"Suggested by the reader — CertBlueprint has no checked trial for this
field yet"*. The difference between a checked instruction and a generated one is
exactly what someone needs before following it.

### Two things the graph fixed for free

The model was asked for a field name and sometimes returned a whole sentence,
which rendered badly in the highlighted slot. With a canonical label available,
the graph's own wording is used whenever the key resolves. And the page footer
claimed a military-translation module that does not exist — it is a Phase 3 item
— alongside a dead `#guided` anchor. Both corrected.

### Cost

`/navigator/lab-graph.json` is 24 KB, generated at build time from the same role
and trial data as every other page, fetched once and cached. The lab is still a
single self-contained file with no framework. The Astro client bundle is
unchanged: the field map never reaches any bundled script.

---

## 22e. Comparing two roles

The results page deliberately refuses to fake precision: three roles within two
points are the same answer, and it says so. That is honest and it leaves the
reader exactly where they started. This is the follow-up — **106 comparison
pages**, each putting two roles on the same 41 dimensions.

Nothing is authored per pair. Everything is derived from the vectors the matcher
already uses, because a hundred hand-written comparisons would drift out of step
with the role data the first time a vector changed and nobody would know which
ones.

### Why 106 and not 703

Thirty-eight roles make 703 possible pairings and almost all are nonsense. A pair
earns a page one of two ways, both from existing data:

1. **Someone authored the move** — one role lists the other as adjacent.
2. **The vectors say they are confusable** — overlap ≥ 78% *and* a shared field.

Building all 703 would also be the textbook programmatic-SEO footprint: a
142-page site sprouting 700 near-identical pages. "These two are not really
comparable" is a true and useful answer, so those pairs have no page. Computed
pairs are capped at 5 per role so hub roles like Security Engineer cannot bury
the comparisons that matter; authored adjacency is never capped.

The build fails if any role appears in **no** comparison — verified by forcing
one out and watching it die. A role nobody can reach while deciding between two
things is a dead end, and nothing else in the codebase would notice.

### Three engine decisions that mattered

**Scale each role by its own strongest trait, not per group.** Role vectors are
authored 0–10 where only within-role magnitude means anything. `normalizeByGroup`
is right for rendering one person's profile and quietly wrong here: it would give
a role that barely touches security the same full-height top security bar as a
role that does nothing else — erasing the exact difference the reader came for.

**A difference only counts if one side genuinely does it.** The first build's
headline difference between Network Administrator and NOC Technician was
*project delivery*, scored 3 and 0. The largest proportional gap, and completely
uninformative — neither job is project work. Divergences now require the leading
role to be at least half its own peak on that dimension.

**Round before comparing.** Vectors are whole numbers, so a gap of exactly 0.2 is
common — and unrounded it evaluates to 0.19999999999999998, which filed
"Troubleshooting 70 vs 50" under what two roles have *in common*.

After those three, the closest pairs read correctly: SOC Analyst leads Incident
Responder on monitoring and trails it on incident response; Network Administrator
leads NOC Technician on troubleshooting and trails on monitoring.

### Honesty rules on the page

- **The "lean toward" lists take at most one dimension per group.** Straight
  ranking produced "Data" followed by "Data & storage" — one point made twice,
  while the genuinely different reason sat below the cut.
- **A short bar is explained.** Vectors are sparse, so an omitted dimension
  renders as zero and reads as "never does this". The page says plainly that a
  short bar means the trait is not what *defines* the role.
- **No two medians side by side.** That turns a career decision into a
  bigger-number contest, and for 17 roles one of the two figures is a directional
  guess. Entry pay appears; the role page carries the median with its caveats.
- **Trials must differ, or say they don't.** Trials attach to capabilities, so
  similar roles often resolve to the same one — it was printed in both columns on
  the first build, under a heading promising to show the difference. Now each side
  gets a trial unique to it where one exists; where none does (57 of 106 pairs)
  a single card says the same experiment covers both, which is itself a finding.

### Where it is reachable from

The results page offers a comparison when two of the top four land within 8
points — verified on a real run that tied Network Engineer and Service Provider
Network Engineer at 73% and offered exactly that page. Role pages carry an
"Often confused with" strip. The index groups all 106 by field.

### Client cost: zero

Comparison logic is server-side only. The shared chunk is unchanged at 28,110
brotli. The results page embeds a 4.5 KB list of which pairs have a page, because
pair selection depends on role adjacency — which lives in role content and must
never be bundled into a browser script.

---

## 22f. The career map

Every role page says "IT careers are a graph, not a ladder" and then prints a
list. `/navigator/graph/` is that claim actually drawn: **38 roles, 86 moves**,
laid out by force simulation, with the ways in marked.

### Computed at build time, no dependency

The layout is about sixty lines of arithmetic — Fruchterman-Reingold with one
addition, a weak pull toward a fixed anchor per field. d3-force would be ~60 KB
shipped or another build step for something the browser never needs to
recompute. The page ships **no layout code at all**; the SVG arrives finished.

**No randomness anywhere.** Nodes are seeded from their field anchor at a fixed
golden-angle offset, and coincident nodes separate along a fixed axis rather
than a random one. A layout that shifted every build would make any visual diff
unreadable and would silently change the page on every deploy.

The field anchors are the reason the drawing means something. Pure force layout
gives a legible but meaningless arrangement — networking roles scattered through
security ones. Anchors hold fields together; edges pull the intersection roles
into the gaps between them, which is where those jobs actually sit. Nothing puts
Network Security Engineer between networking and security deliberately: it is
dragged there by having connections on both sides.

### What the drawing encodes

- **Colour** — the role's primary field.
- **Size** — degree. Bigger circles keep more options open, and the page names
  the top three.
- **A second ring** — reachable as a first job. Someone with no experience is the
  reader most likely to be lost on a map like this.

### Three build-time guards

- **The graph must be connected.** A role in its own island is a job this site
  describes and then shows no way into — invisible in an adjacency list, since
  each role page still looks complete.
- **Every role must be reachable from some first job.** The site tells beginners
  IT is enterable; this checks that claim per role instead of asserting it.
- **The drawing must be legible.** Label placement is a search, and a search can
  run out of room. `assertLayoutLegible` fails the build on any label that
  overlaps another, sits on someone else's dot, or is clipped by the viewBox.

That last one exists because the failure is silent: the page still renders, still
deploys, and quietly stops saying what it claims. Verified by shrinking the
canvas until labels collided and watching the build die. **If it fires, give the
layout more room — do not delete the check.**

### Getting the labels right

The first build was the honest version of this feature failing. Labels overlapped
in the dense middle ("Network Security Engineer" on top of "Vulnerability
Management Analyst" — both present, neither readable) and long names ran off both
edges because the canvas was fitted to the dots, not to the text.

Fixed with a placement pass: hubs choose first, each label tries both sides and
a few vertical offsets, and the score treats a collision as worth far more than
any positional preference. Other roles' **dots** are obstacles too — a name
resting on someone else's circle reads as that circle's name, which makes the
drawing state something false. Vertical nudging is capped at 16px, because past
that a label stops belonging to its own dot.

Result: 38 labels, **zero overlaps, zero clipped, 4 nudged, max 12px** — verified
both at build time and against real rendered font metrics in a browser.

### Interaction is enhancement, never requirement

The SVG is complete without JavaScript: real `<a>` elements, real `<title>`s,
keyboard-focusable, crawlable. The script adds hovering or focusing a role to
light up just that role and its neighbours — which answers "I'm at help desk,
where can I go?" in one gesture — plus field filters and a "ways in" filter.
Without it, nothing is dimmed, which is the correct default state.

### The map exists in words too

A `<details>` carries every role and its moves as text. A drawing is useless to a
screen reader, and "look at the picture" is not an acceptable answer on a page
whose entire subject is where you can go next.

### Mobile

The map scrolls inside its own container at full size rather than shrinking.
Scaling 38 labels down to 390px would make every one of them unreadable, which
is worse than asking someone to pan. Verified: the page itself never scrolls
sideways.

---

---

## 22g. Sharing a result without a server

A result lives in one browser tab and dies with it. That is the right default,
and it is also why nobody could ever show anyone — a mentor, a partner, someone
in a thread who asked what they got.

The answers go in the **URL fragment**. Fragments are not part of the HTTP
request, so Cloudflare, the logs and every intermediary see `/navigator/results/`
and nothing more. The link carries the result to the recipient's browser, which
recomputes it locally. No database, no share table, no identifier, nothing that
can leak later because nothing was ever stored.

### Answers, not scores

`#r=1.b04a.b08c.b06a.…` — a format version, then one token per answer: the
scenario's numeric prefix plus the option letter. Sixteen answers is **128
characters**.

Encoding the answers rather than the scores is the honest choice twice over. It
is smaller, and a stale link can never display numbers this site would no longer
produce — if the engine improves, an old link improves with it, while what the
person actually chose stays exactly what it was.

Addressing scenarios by prefix also survives rewording: renaming
`b01-night-outage` to `b01-2am-outage` does not break links already sent.

### The guard that makes it safe

All of that rests on one assumption — a scenario's numeric prefix identifies it
uniquely. Add `b07-something-else` next to `b07-impossible-login` and every link
containing `b07` silently resolves to whichever the map happened to keep.
`assertShareCodecIntegrity` fails the build on a duplicate prefix, a
non-single-letter option id, or a maximum-length result that would exceed the
character cap. Verified by introducing a collision and watching the build die.

### Someone else's result is framed as someone else's

Presenting a friend's answers under "Here is what you kept reaching for" would be
the most misleading thing this page could do. A shared view changes the heading,
carries a banner saying whose it is, hides every personal control, and offers
"Answer them yourself" instead.

It also **never touches the viewer's stored session** — verified: opening a link
in a browser that already had 16 answers left all 16 intact and offered "Back to
my own result".

### Partial and broken links

A link naming scenarios this build no longer has still works: the readable
answers score, and the page says how many were dropped rather than passing off a
partial result as whole. A link that is unreadable end to end gets a plain
explanation and a route forward — never a blank page.

### The inventory is not in the link

Technology inventories stay on the device. They are a more identifying dataset
than a set of scenario choices, and they are stored under an explicit-consent
model that quietly packaging them into a shareable URL would violate.

That creates a discrepancy worth naming, so the page names it **precisely**:
if dropping the inventory changes the top match, the share box says which role
the recipient will see instead. Vague warnings get ignored; "the link will read
Network Automation Engineer rather than Network Engineer" does not.

### Cost

`/navigator/results/` is already `noindex`, so shared links are not crawled. The
shared chunk grew **28,110 → 28,133 brotli (+23 bytes)** — the codec reuses the
scenario data the page already had.

One real bug found in testing: pasting a share link while already on the results
page changes only the fragment, which does not reload the document, so the page
sat there showing the previous result as though the link were broken. A
`hashchange` listener now re-runs it.

---

---

## 22h. Military occupation mapping

Veterans are underserved by career tools in a specific way: the tools ask what
you have done and then fail to understand the answer. "25B" means nothing to a
keyword filter and everything to the person who spent four years doing it.

`/navigator/military/` maps **26 occupations across 6 services** onto the same
capability graph the technology inventory uses. Entered through a different
door, scored by the same engine.

### The code list is the shortcut, not the source of truth

Occupation codes rot. The Air Force consolidated its cyberspace support AFSCs in
2021; the Army has restructured the 25-series more than once. A career site
quietly serving a stale lookup table is worse than one that never had it.

So the architecture puts the capability picker first and the codes second:

- Selecting an occupation **pre-ticks capabilities the user then edits**. What
  they actually did outranks what a table thinks their code means — two people
  with the same code did different jobs.
- Anyone whose code is missing or renamed uses the picker directly and gets an
  identical-quality answer, because the picker is what the matching runs on.
- **Retired codes are kept and labelled.** A DD-214 carries the code from the
  year it was issued, so `3D0X2` is exactly what someone will search for. The
  page says what happened to it.
- Every service links to its own COOL site as the authority.

That structure bounds the cost of a stale row to one unticked checkbox rather
than a wrong answer.

### Three things the page says that the assessment cannot

- **You may already hold the certification.** DoD 8140 (formerly 8570) means
  large numbers of people separate already holding Security+ or CCNA without
  thinking of it as a civilian credential. It is the same certification the
  employer is asking for.
- **A clearance is worth money**, does not stay active forever, and the
  reinstatement window is time-bound — stated as "check the current rules",
  not as a specific figure this site cannot keep accurate.
- **The filter cannot read your code.** The capability names on the page are
  deliberately the words the industry uses, and are worth borrowing verbatim
  when rewriting a CV.

### What gets stored

Capability slugs, never an occupation code. Storing "25B" would mean storing the
fact of someone's service in their browser, which is more than the feature needs
— what they can do is enough for the scoring, and it is what they edited and
confirmed anyway.

### Wired into the same seed

Confirmed capabilities join the technology inventory as a seed for the
assessment and results, summed rather than ranked against each other because
they are the same kind of evidence. `scoreAssessment` normalizes and weights the
sum, so neither drowns the other.

Verified end to end: a security-heavy capability set pushes Network Security
Engineer into the top five at 68% against an otherwise networking-shaped answer
set, and it drops out when the capabilities are removed. A seed that sharpens,
not one that overrules.

Two rules the wiring has to keep, both checked:

- **A shared link is never seeded by the viewer's device.** Someone else's
  result must not be quietly re-scored using your experience.
- **Every influence is disclosed.** The results page names both sources by
  name — a seed the reader cannot see is a hidden weighting, however small its
  effect.

### The guard

`assertMilitaryIntegrity` fails the build on an unknown capability slug, a
duplicate occupation, a service with nothing behind it, or an occupation mapping
to nothing. The capability check is the one that earns its place: a typo'd slug
is silently ignored by the scoring engine, so the page would still render, still
look complete, and quietly under-credit whoever picked that occupation — which
is the exact failure this feature exists to correct. Verified by injecting
`seim-engineering` and watching the build die.

---

---

## 22i. Progress against a chosen path

The feature on this site with the clearest route to becoming something
dishonest, so the constraints were fixed before any code was written.

**No single readiness number.** "You are 62% of the way to being a SOC Analyst"
is a lie with a decimal point in it — people get hired halfway down a roadmap
all the time, and others finish one and still have a hard search. Progress is
reported **per section, as counts**, against an authored roadmap. What it
measures is how much of *this plan* someone has worked through. That is the
only thing it can honestly claim, and the page says so above the first
checkbox, because a list of boxes implies a gate and this is not one.

**No streaks, no badges, no nudges.** Nothing here should make someone feel
they are failing at a career they have not started.

### Built on authored data, not derived requirements

The first design derived required capabilities per role from the capability
graph. It was abandoned after measuring it: capability→role tags are uneven
(Digital Forensics Analyst carries one), and a vector-similarity fallback has no
usable threshold — cosine between a capability and a role rarely clears 70, and
the distribution varies so much per role that Network Security Engineer scores
**zero** capabilities above 70 despite having fourteen authored. A gap analysis
on that data would have told someone with one box ticked that they were done.

The 11 `/paths/` roadmaps are authored, ordered, and already carry stages,
skills, certifications and a trial. Tracking against those is both honest and
better data. Each path gets its own page at `/navigator/plan/<path>/`.

### Progress is kept per path

Someone who explores the SOC route for a month and then switches to networking
has lost nothing, and never has to weigh a change of mind against a warning
about erasing history. Verified: opening a second plan starts empty and the
first survives intact.

Clicking an active state again clears it — the only way to undo a mis-tick
without a third "not started" button nobody would read. In-progress is counted
and displayed **separately** from done, never folded into it.

### Two build guards

- **Every certification a plan links must exist.** A dead link inside someone's
  plan is invisible otherwise — the stage still looks complete. Verified by
  pointing a path at `sc-901-does-not-exist`.
- **Roadmap stages must run 1..n in order.** The stage number is both the label
  and the storage key for progress.

### A pre-existing bug this surfaced

Cloud Engineer's roadmap was numbered from zero, so the live `/paths/cloud-engineer/`
guide had been rendering "Stage 0, Stage 1, Stage 2, Stage 3" for as long as
that page existed. Fixed in the data, which corrected both the existing guide
and the new tracker, and the numbering guard now prevents it recurring.

---

---

## 22j. The capability→role tag gap

Flagged early, deferred with a stated reason, and the reason turned out to be
wrong — so it is written down here rather than quietly fixed.

### The symptom

Capabilities carry a `roles` list meaning "roles for which this capability is
load-bearing". It was badly uneven: **7 roles were named by exactly one
capability** (Digital Forensics Analyst, DevSecOps Engineer, Cloud Architect,
Data Engineer, Data Analyst, Help Desk Technician, NOC Technician) while Network
Security Engineer had fourteen.

That list is what `trialsForRole` routes through, so the visible damage was in
the trials feature: **19 of 38 role pages showed exactly one weekend trial**
while SOC Analyst showed six. Every page still rendered correctly, which is why
nothing ever complained.

### The deferral was based on a wrong belief

The original note said widening these tags "would also change inventory
matching". It does not. The engine scores on capability **vectors**; `roles` is
only a routing tag. An A/B build across the whole edit produced **byte-identical**
assessment results, confidence levels, domain scores, inventory implied-roles and
capability vector hashes. Worth stating plainly: the caution cost the trials
feature half its coverage for no reason.

### Why the fix was curated, not computed

Three automated derivations were tried and measured before any were applied:

| Rule | Result |
|---|---|
| Technologies imply the capability | 537 pairs — Python alone implies four capabilities |
| Add vector-similarity rank | 236 pairs — proposed *detection engineering* for a data engineer |
| Add domain overlap | 209 pairs — still proposed *forensic analysis* for a penetration tester |

The last failure is structural and was predicted in section 1 of this document:
cybersecurity is one domain covering SOC, GRC, pentest, forensics and identity —
"five unrelated temperaments" — so a domain-overlap filter cannot separate them.

So the automation was used to shortlist, and the actual question was asked
per-role instead: *which of the 12 trials genuinely tests this work?* That is 19
decisions rather than 209, each one checkable against a real page. **54 tags
across 27 capabilities.**

### Result

| | Before | After |
|---|---|---|
| Roles showing one trial | 19 | **0** |
| Median trials per role page | 2 | 3 |
| Comparison pages with two *different* trials | 49 | **77** |
| Assessment output | — | byte-identical |

### The guard covers both directions

`assertCapabilityGraphIntegrity` fails the build if any role is named by fewer
than 2 capabilities, or if any capability names more than 55% of roles. The
second bound matters as much as the first: over-widening is the tempting fix,
and if capabilities name most roles then every trial appears on every role page
and the recommendation stops meaning anything — a failure even quieter than the
one being fixed. Both directions verified by breaking them.

---

## 22k. Site-wide trust, crawl and AdSense-readiness pass (2026-09-12)

Prompted by a traffic/AdSense audit of the built site. No Navigator scoring or
data changed; everything here is crawl hygiene, trust copy, and internal links.

**Canonical host and retired URLs.** `wrangler.toml` now sets
`run_worker_first = ["/*", "!/_astro/*"]` so page requests reach the Worker,
which 301s `www.certblueprint.com` to the apex and `/navigator-app(.html)` to
`/navigator/`. The old meta-refresh stub is deleted. Because `_headers` is not
applied to Worker-served responses, `worker/index.js` re-attaches the same
baseline headers (`withSiteHeaders`) — keep the two in step.

**Sitemap.** `/navigator/plan/<path>/` trackers are noindex and are now filtered
out; `/navigator-lab` (a public/ file Astro does not route) is added via
`customPages`. The 404 page is noindex with no canonical (`canonicalUrl={false}`).

**Snippets.** BaseLayout drops the ` | CertBlueprint` suffix from titles over 60
characters and clips meta descriptions at a word boundary (158). Page files
keep their full strings; the layout decides what is emitted.

**Social images.** `scripts/generate-og-images.py` (Pillow) writes
`public/og/<section>.png` and `public/og/vendor-<slug>.png`. BaseLayout picks the
most specific file that exists on disk, else `og-default.png`. Re-run the script
after adding a vendor.

**Reverse links cert → role.** `RolesForCert.astro` renders "Jobs where X shows
up" on every certification guide that at least one role lists in
`RoleContent.certs`, with that role's stated reason. It renders nothing when no
role references the cert (17 of 53 today). Home page gained a Navigator section
and the footer a Career tools column.

**Trust copy.** About no longer claims content is not AI-assisted or that every
guide is practitioner-reviewed — it now states that AI tools help draft, that
hard facts are checked against vendor pages and dated, and how the site is
funded. Contact explains what to include, what happens to corrections, and what
we cannot help with. `/navigator-lab` now loads the same consent + analytics
stack (no AdSense — it is a thin, interactive page) and has a site bar and
policy footer.

Do not reintroduce claims about human review that are not true in practice.
Do not add `run_worker_first = true`; hashed assets must keep bypassing the Worker.

**Thin interactive pages (follow-up, same day).** `/navigator/assessment/` and
`/navigator/inventory/` were under 300 words of crawlable text because the
tools render client-side. Both now carry a server-rendered explainer: a real
scenario (assessment) or real technology→capability example (inventory) pulled
from data, how the engine works, how to read results, where data goes, and a
FAQ. Every number is imported (phase lengths from `engine/adaptive.ts`,
dimension groups, role/technology/capability counts), so the copy cannot drift
from the engine. On the assessment the explainer lives inside `#nav-intro`, so
it disappears once questions start; `begin()` scrolls to the top because the
second Start button sits at the bottom of a long page.

Do not describe results as showing "the specific choices" behind each role —
per-role explanations come from contributing dimensions; choice rationales are
shown once, for the whole result.

**Header overflow (found while verifying the above).** `.theme-btn` in
`global.css` was unlayered CSS with `display: inline-flex`, which beats
Tailwind's layered `sm:hidden` / `md:hidden`. The mobile menu button and mobile
search icon therefore showed at every width, pushing the header ~32px past the
viewport on ~1000px screens (horizontal scroll sitewide). Fixed by moving the
rule into `@layer components`, and by switching the desktop nav from `md` to
`lg` — nine links do not fit beside search and theme controls below 1024px.

Do not add unlayered CSS that sets `display` on elements that also carry
Tailwind display utilities; put component classes in `@layer components`.

**Navigator Lab explainer (follow-up, same day).** The lab moved from
`public/navigator-lab.html` to `src/lab/navigator-lab.html` (a template) and is
rendered by `src/pages/navigator-lab.html.ts` to the same URL. The endpoint
fills `<!--LAB:HEAD-->` (WebApplication JSON-LD) and `<!--LAB:EXPLAINER-->`:
how the lab works, what the model writes vs what comes from checked data, all
22 fields from `LAB_FIELDS` grouped by track with real role links, what happens
to submitted text, limits, lab-vs-assessment, FAQ. The model name, turn cap and
per-message cap are read from `worker/index.js`, so the copy follows the worker.

Build guards (both verified by breaking them): the worker model must still be
Llama 3.3 70B or the model sentence must be rewritten; and the page's answer
limit plus the `Q: "<opener>"
A: ` wrapper must fit under the worker's
`MAX_MSG_CHARS`. That second guard caught a live bug — the page allowed 1,400
characters but the wrapped first message could exceed the worker's 1,500 cap
and fail with a generic error. The page limit is now 1,300.

The privacy policy now describes Navigator browser storage, the Lab's AI
processing via Cloudflare Workers AI, and lists Cloudflare as a third party.

Do not move the lab back into `public/` — a file there would collide with the
endpoint output and bypass the guards.

**Internal linking pass (same day).** Audit of content links (site header and
footer excluded) found 36 indexable pages with two or fewer inbound links.
Fixes, all data-driven:
- `CertMoreLinks.astro` on every certification guide: head-to-head comparisons
  featuring the cert, and every other certification from the same vendor,
  ordered by level. New guides and comparisons are linked automatically.
- Role → cert edges added where the cert guide's own audience says so: CCFT
  (field, data centre), CCST IT Support (help desk), CCST Cybersecurity and
  Google Cybersecurity (SOC, as alternatives), CCNP Cybersecurity (SOC, IR,
  threat hunting), Cloud+ (cloud), and the CCIE Data Center, Automation,
  Wireless and Enterprise Infrastructure labs. 46 of 53 guides now show roles;
  the other 7 (collaboration, AI practitioner, PM/Scrum/QA) have no matching role.
- `RoleProfile` lists every comparison pair for a role instead of the first
  six, which had left three comparison pages linked from neither role.
- The navigator compare index links to certification comparisons, and the
  assessment explainer links to the Lab.

Result: 5 pages at ≤2 content links, all of them site chrome (about, contact,
terms) or single-cert vendor hubs that the vendors index links.

`astro.config.mjs` now runs `internalLinkCheck()` on `astro:build:done`: any
`href="/…"` outside a script that does not resolve to a built file fails the
build (verified by introducing a typo). Do not silence it by widening IGNORE;
fix the link.

## 22l. The career map as an application (2026-09-24)

Prompted by a deep-research report recommending the map become a product rather
than an illustration. Built as an island over the existing server-rendered SVG,
not a rewrite: the page still renders every role as a real link, the written-out
map still exists, and the app enhances what is already there.

**No graph library.** The report's default suggestion was Cytoscape. We already
compute the layout at build time with label placement and a legibility assert;
adopting a general engine would have replaced that with worse labels and shipped
~300KB. The whole application is 25KB of source (6.9KB brotli) plus a 19KB
brotli payload, and does pathfinding, overlays and viewport control itself.

**Moves are directed now.** `graph-data.json.ts` builds transitions from role
adjacency in the direction it was authored, carrying the authored reason.
`data/graph.ts` still collapses them to undirected edges for the drawing,
because a line has no direction — but a route does. Routing is BFS over
authored moves; a reverse move nobody wrote is not evidence, so "no authored
route" is a real answer the panel gives (with an offer to swap).

**What that check found.** Directed reachability from the ten first-job roles
failed on `database-administrator`: nothing listed it as a next step, so the
page's claim that every role is reachable was true only undirected. Three
inbound moves were authored (systems administrator, data analyst, data
engineer). The build now fails if any role becomes unreachable this way.

**Six modes**, all sharing one state → paint() cycle: Explore (role panel with
pay, downside, where it leads and why, certifications by stage, trials,
comparisons), Build a path, Ways in (hop rings from an entry role), Compare
(curated pairs only), Skills (technology → roles, plus "highlight what I already
know" from the local inventory), Certifications (cert → roles with fit stage).

State lives in the URL fragment and localStorage only — no analytics events were
added; the fragment is not sent to servers, which is why it is the right place
for it.

Do not let a selected role survive a mode switch (it hid the certification list
and narrowed Path highlighting — fixed by clearing `state.role` in the mode
handler). Do not treat an absent `mode=` in the hash as "keep current mode": the
hash is the whole state, and a `#role=` deep link from a role page must land in
Explore. `touch-action: none` on the stage means pinch is ours to implement —
it is, alongside +/-/Fit/Reset and a transparent 16px hit circle per node.

**Outbound link rot (2026-09-24).** A reader hit Access Denied on the Navy and
Air Force COOL links. The service paths do not follow the obvious pattern: Navy
COOL is `/usn/`, not `/navy/`; the Air Force left cool.osd.mil for AFVEC
(`afvec.us.af.mil/afvec/af-cool/welcome`); and there is no Space Force COOL at
all — Air Force COOL covers enlisted Department of the Air Force members, so
Space Force now points there and the page says why. Taken from the COOL
portal's own service list, verified in a browser.

A sweep of all 370 outbound links then found one more dead link (a Professor
Messer SY0-701 URL 404ing on the Google Cybersecurity page — the correct URL was
already in security-plus.json) and two destinations that had changed character:
CISA Learning now requires a free account, and Linux Journey redirects to LabEx.
Both notes were corrected rather than the links removed.

`scripts/check-external-links.mjs` (`npm run check:links`) is that sweep, kept.
It cannot live in the build — builds must work offline and must not depend on
anyone else's uptime. Many hosts 403 scripts while working fine in a browser
(cool.osd.mil, Udemy's affiliate redirector, PMI, Amazon, Exercism, CISA,
LabEx), so those are listed as known blockers and reported separately. Always
open a flagged URL in a real browser before changing it.

**Content completeness audit (2026-09-24), before adding more guides.**
Adding a certification is already close to automatic: a JSON file in
`src/content/certifications/` generates its page through the collection-driven
`[vendor]/[cert]` route, and the schema floors (3+ skill groups, 5+ study steps,
3+ free resources, 4+ FAQs, 3+ related certs) mean it cannot ship thin. Vendor
sibling links, the vendor count badges and the sitemap all derive from the
collection too.

Two things did NOT derive, and both are fixed:
- The search index was a hand-maintained array inside `SearchModal.astro`. It
  had already drifted — all 53 certs listed, but none of the 11 career paths and
  none of the 38 role pages. It is now generated (`pages/search-index.json.ts`,
  148 entries) and fetched on first open instead of inlined into every page.
- Nothing checked that a new guide is actually linked from its vendor hub, which
  the bespoke Cisco/CompTIA/AWS/Microsoft hubs list editorially. The build now
  fails when a cert page is not linked from `/vendors/<vendor>/` or a path from
  `/paths/` (verified by deleting a guide entry from the Cisco hub).

Remaining content gaps, which need an author rather than code:
- All 53 guides now carry `last_verified` (22m and 22n). Keep the rule when
  refreshing: never backfill a date nobody checked — the stamp is only worth
  anything if it means someone re-read the vendor page that day.
- `ai-technical-practitioner` has no salary_range and no question count. That
  one is deliberate: Cisco does not publish either, and `salary_note` says so
  outright rather than inventing a range. Leave it.

---

## 22m. The eleven thin guides, and the exam facts that were stale (2026-09-24)

A completeness audit ranked all 53 certification guides by the word count of
their four prose fields (`description`, `audience`, `why_get_it`,
`when_to_get_it`). Ten sat 200–260 words against a 300–450 median, and `ccna`
— the single most-searched credential on the site — was the thinnest page of
all at 174. All eleven were rewritten to 290–330 words.

**Verification came first, because the stamp has to mean something.** Every
fact was checked against the vendor's own exam page in a browser before the
prose was written. That turned up three errors that had been live for months:

| Guide | Was | Is |
|---|---|---|
| Linux+ | XK0-005 | **XK0-006** — launched 15 Jul 2025, XK0-005 retired |
| CySA+ | CS0-003 | **CS0-004** — launched 23 Jun 2026; CS0-003 English retires 22 Dec 2026 |
| Cloud+ | "pass/fail, no numeric score" | **750** on 100–900 |

Also captured, because they expire on a date readers need: DVA-C03 opens for
registration 27 Oct 2026 and DVA-C02 stops 1 Dec 2026; CCNA v1.1's last test
date is 2 Feb 2027 under the same 200-301 code. Each became an FAQ at position
zero, where a version question actually gets read.

**A code change is never one file.** The global replace inside the two JSON
files was safe for prose and objective titles, but the affiliate URLs embed the
old code in lowercase (`comptia-linux-xk0-005`) and point at courses that
genuinely target the old version — so those were left alone and every affected
resource note now says to check the edition before buying. The two stale
references on `/vendors/comptia/` were only found by grepping for the old codes
across `src/`, which is the step to repeat whenever an exam code moves.

**`last_verified` was rendering on only some pages.** The field has been in the
schema for a while and `CertGuide.astro` renders it, but six guides
(`aws-saa`, `ccna`, `ccna-automation`, `ccna-cybersecurity`, `security-plus`,
`az-104`) are bespoke ~300-line pages that predate the component. They read
their data from the collection, so the new prose appeared — but the stamp did
not, because that markup lives in `CertGuide`. Stamping data that the page
silently drops is worse than not stamping it: the guarantee looks kept.

The stamp was added to all six, and the build now asserts the invariant: any
certification whose JSON sets `last_verified` must render "last verified" on
its built page. Proven by deleting the block from `ccna` — build failed with
`/vendors/cisco/ccna/ sets last_verified but does not render it` — then
restored. This is the third build-time check in `internalLinkCheck`, after
broken internal links and hub coverage.

**Then unstamped: 21 of 53 guides** — not an oversight, since a stamp claims
someone opened the vendor's page on that date. Those 21 were verified and
stamped the same day; see 22n below.

---

## 22n. Verifying the other 21, and what verification is for (2026-09-24)

Every one of the 53 certification guides now carries `last_verified`. The 21
that did not were checked the same way as the eleven in 22m: open the vendor's
own page in a browser, read the exam details, then write. That produced one
version change nobody had noticed, one retirement date worth planning around,
and — more usefully — a list of claims the site could no longer stand behind.

**Version and date changes found**

| Guide | Change |
|---|---|
| Security+ | V8 (**SY0-801**) launches on or around **17 Nov 2026**; SY0-701 retires (English) 11 Jun 2027, other languages 13 Aug 2027 |
| CISM | ISACA updates the **Exam Content Outline on 3 Nov 2026** |
| MS-900 | Successor confirmed as **AB-900** (Copilot and Agent Administration Fundamentals); its English version updates 14 Oct 2026 |
| Google Project Management | **Seven** courses, not six |
| Google Cybersecurity | **~170 hours** of instruction, not the ~133 we had |
| AWS SAA | Italian version retires after 31 Dec 2026; no SAA-C04 announced |

Facts we were missing and now state: Security+ passes at 750/900 (the page
never said); A+ Core 1 and Core 2 must come from the **same version**, no
mixing; Microsoft schedules associate exams at 100 minutes with 120 minutes of
seat time, and lets you read Microsoft Learn *during* associate and expert
exams; an active AWS certification earns a **50% discount voucher** toward the
next one; CompTIA CE fees are payable with $25 and $50 CE Tokens; ISACA gives a
six-month eligibility window ($75 to extend) and four attempts per rolling 12
months; a CISSP pass without the experience makes you an Associate of ISC2 with
six years to earn it; PSM I passwords never expire but are good for one attempt.

**The more valuable outcome: three claims we had to withdraw.** Each was
specific, plausible, repeated across a page, and no longer supported by any
source the vendor publishes.

- *Google IT Support → "30% off both CompTIA A+ exams."* What Google and
  Coursera actually publish is a **dual Google + CompTIA badge** and ACE credit
  for up to 15 college credits. No discount appears anywhere. Removed from the
  description, why/when sections, a study step, a paid-resource row, two FAQs,
  a related-cert reason and the SEO description.
- *Google Project Management → "$175 off the CAPM exam plus a 90-day PMI
  membership trial."* Coursera states only that the program "qualifies you for
  over 100 hours of project management education" — which is the genuinely
  valuable part, since CAPM asks for 23 hours and the PMP for 35. The discount
  and the trial are gone; the hours stay.
- *Google Cybersecurity → "30% off Security+ (about $307 instead of $439)."*
  Here the discount is real — Coursera says graduates "can access the CompTIA
  Security+ exam and training at a discounted price" — but the **rate is no
  longer published**. The perk stays, the arithmetic goes.

Also withdrawn: every quoted CompTIA voucher price. CompTIA publishes voucher
pricing only inside its own store checkout, which is a purchase flow, so the
pages now say exactly that instead of quoting a number. Same treatment for PMI,
which shows the fee during the application. Prices that a vendor *does* publish
openly are quoted as verified: $150 AWS SAA, $300 Cisco 200-901/200-201, $749
and $998 CISSP, US$575/US$760 CISM, $200 PSM I, $50 JNCIA via the Open Learning
voucher, US$690/$1,029/$1,338 for PeopleCert's ITIL bundles, $49/month Coursera.

The Google certificates' study times were estimates presented as facts
("~80–115 hours", "~142 hours"). They now quote Coursera's own course count and
pace, which is a number with a source behind it.

**The rule this pass established.** A `last_verified` stamp is a claim about
the whole page, not about the exam-details box. So a fact that cannot be traced
back to the vendor on the day of verification either gets hedged with its real
provenance or gets deleted — even when it is useful, even when it was probably
true once. The three withdrawn discounts were each worth real money to a reader
who planned around them; that is precisely why leaving them in would have been
the expensive choice.

---

## 22o. Showing the map instead of describing it (2026-09-24)

`/navigator/` offered two doors as two paragraphs. One of them led to a
drawing, and describing a drawing in a sentence sells none of it — "open the
career map" asks a stranger to take it on trust.

The map card now opens with the map. `CareerMapPreview.astro` renders the same
38 nodes from the same `layoutGraph` positions as `/navigator/graph/`, with
everything that needs reading stripped out: no labels, no controls, no
interaction, `aria-hidden`. The viewBox is tightened around the dots, because
the full layout reserves margin for labels this preview does not draw, and
keeping it would shrink the constellation to a smudge. `preserveAspectRatio`
is `slice`, so the strip crops rather than fits — it should read as a window
onto something bigger, which is what it is.

**The one place glow is allowed.** The stylesheet has said since it was written
that neon and glow are absent. They still are, with this exception: the six
roles with the highest degree get a `drop-shadow`, so the brightest points on
the picture are the ones the most moves pass through. Lighting all 38 evenly
would have been decoration; lighting the hubs is the same claim the big circles
on the real map already make. The file's header comment now says so rather than
contradicting itself.

**The pill states counts, not adjectives.** "Interactive" is a claim about the
page; "38 roles · 88 moves" is the picture above it, and both numbers come from
the same arrays the map is drawn from, so they move when the data does.

**The two doors no longer stretch to match.** Forcing equal heights left a hole
under the shorter card's text. `align-items: start` lets the map card hang
lower than the one beside it, which is the right emphasis: it is the one with
something to show.

**The same mark now sits in the header pill.** `MapGlyph.astro` — three roles
and the two moves between them, sized in `em` and filled with `currentColor` —
renders in the desktop nav, the mobile menu and the card badge from one source,
because three hand-maintained copies of a path is how they end up subtly
different. The Navigator item is the only nav link with a mark: an icon on every
item is decoration, one icon on the one visual destination is a signpost.

**It cost 12px the header did not have.** At exactly 1024px, where the desktop
nav appears, the row already fit with nothing to spare — adding the glyph pushed
it 12px past its container, which is the same class of bug as the `.theme-btn`
overflow in 22k. Link padding went from `px-3` to `px-2.5`, which is invisible
and buys 36px back; measured slack at 1024px is now 22px with the glyph in
place. Worth remembering before anything else is added to that row.

**Guarded, because this fails silently.** An empty preview still renders a tidy
violet card with a paragraph in it — nothing looks broken, and the whole reason
for the change is gone. The build now counts `nav-map-teaser__dot` on
`/navigator/` against `nav-graph__dot` on `/navigator/graph/` and fails if they
differ. Proven by deleting the component from the page: *"/navigator/ draws 0
roles, the map at /navigator/graph/ draws 38."* Restored.

---

---

## 22p. The field chips were lying, and other things the map got wrong (2026-09-24)

Five complaints from one session of actually using the map, and one of them was
a real bug hiding behind a design problem.

**The field chips did nothing.** Ways in, Data and Support & Operations all drew
the identical picture, and so did every chip while a role was open. The cause is
one line of ordering in `highlightSets()`: the field built `keep` *first*, and
then every mode branch below assigned `keep` outright, throwing it away. In plain
Explore with no role selected — the only case anyone tested — it survived, so it
looked fine. The focus block finished the job with `if (keep.size < 2) keep =
related`, a guard against an empty map that silently discarded the field whenever
its intersection with the open role's neighbourhood was small.

The field is now applied **last**, and it composes rather than replaces:

- with nothing else on screen it filters outright, as before;
- with a focused role or a drawn route it marks instead of deletes — those roles
  stay drawn at `data-field="out"`, faded. Deleting them would break the
  neighbourhood or, worse, draw half a route, which is a lie about the data;
- the hint reports the count: *"Security Architect — 10 of 12 roles on screen are
  in Cybersecurity. The rest are faded, not hidden."* Zero is a sentence of its
  own rather than a blank map.

That last part matters more than the fix. A filter that visibly does nothing is
indistinguishable from a broken one, so the chip now always produces a number.

**The panel covered the map it described.** It was `position: absolute` over the
canvas. At ≥64rem the stage is now a grid and the panel takes its own column:
`.nav-graph` is `display: contents` so its children become grid items, the chips
span both columns (reflowing them on every open made the page jump), and the
panel is pinned to the canvas's own `min(72vh, 44rem)` so the two align and the
card scrolls inside itself. Letting it share the legend row instead stretched the
row to the card's full height and stranded the map at the top of a column of
nothing — fixed by giving the panel the canvas row alone. Below 64rem it stays a
bottom sheet: covering a map you cannot read at that width is the better trade.

**Clicking a role in the panel now moves the map to it.** It already re-rendered
the panel; what was missing is that the dot you just chose by name might be off
screen or behind the panel. `select()` takes an origin — from the panel it
re-fits the viewport to that role's neighbourhood and scrolls the card back to
the top; from the map it moves nothing, because yanking the viewport out from
under a deliberate click is how a map starts to feel like it is fighting you.
Arriving on a shared `#role=` link fits the neighbourhood too, counting moves in
*and* out; it previously counted only outbound, which framed most roles badly
since most are reached more often than they lead on.

**Brightness and the legend.** The map was drawn at the brightness of a diagram
in a document: grey hairlines, and a legend in three shades of the same grey that
taught nothing because the map uses colour for fields, not for stage. Edges are
now mixed toward the accent at higher opacity, dots carry a small drop-shadow and
the focused dot a larger one, and the legend uses the actual shape language —
ringed dot, filled dot, hollow ring — in the colours the map draws, plus a line
stating that dot colour means field.

**A path you can follow, not just dots.** An undirected grey line says two roles
are related; it does not say which way people move, which is the single thing the
map exists to answer. With a role open, its own moves are redrawn on top as
directed travelling arrows — outward in the accent, inward in emerald, matching
the panel's own "Where it leads" and "How people get here" headings — on a
1.5s dash animation. A route already is a path, so the two never draw at once.
`prefers-reduced-motion` stops the travel and keeps the arrowheads, which carry
the direction anyway. A second arrowhead marker was needed because
`fill: context-stroke` is not safe to depend on yet.

**And the map is on the home page**, wide: artwork left, pitch right, at the foot
of the Career Navigator section.

**Postscript: the dead end was the interesting case.** Picking Cloud, Software &
Automation and Data with Wireless Engineer open all produced the same fully
faded map — correctly, since its entire neighbourhood is Network Engineer,
Network Security Engineer and Field / Infrastructure Engineer. Three honest noes
in a row still read as a broken filter. So when a field contains none of the
open role's neighbours, `routeIntoSet()` — the same breadth-first walk as
`route()`, stopping at the first member of a set rather than one named role —
draws the shortest authored route into that field instead, and the hint names
its length and destination. The card stays on the role that was open; swapping
it for a route card would lose what the person was reading when they reached for
the filter. Now the three chips give three different answers: Cloud is 2 moves
to Cloud Network Engineer, Software & Automation is 2 moves to Network
Automation Engineer, and Data is a genuine nothing.

**Which surfaced a content gap, since closed.** Two numbers, and they measure
different things: **one** of seven fields had a gap, and **19 of 38** roles were
inside it. Every other field was reachable from all 38 roles; Data was reachable
from none of the networking or cloud half of the map. One broken field, broken
badly.

The cause was structural rather than local. Data was entered only from the
analyst cluster (SOC Analyst, Security Engineer, Incident Responder, Digital
Forensics) and from Systems Administrator and Software Developer. The
networking, cloud and security-architecture clusters flow forwards and upwards
and never crossed into it, so no single role looked isolated — each had plenty
of moves — while an entire field sat unreachable behind them.

Six moves close it, chosen because people genuinely make them rather than
because they connect the graph:

| Move | Why it is real |
|---|---|
| DevOps Engineer → Data Engineer | Same orchestration and scheduling, moving data instead of deployments |
| Site Reliability Engineer → Data Engineer | Streaming and batch platforms are production systems, run by the people who already run those |
| Platform Engineer → Data Engineer | Data platform teams are built out of platform engineers who took on the warehouse |
| Cloud Engineer → Data Engineer | The managed warehouses live in the estate they already run |
| Cloud Security Engineer → Detection Engineer | They already know what the cloud logs mean; the detections are the next step |
| DevSecOps Engineer → Detection Engineer | Detection-as-code is that job pointed at the SIEM |

The four into Data Engineer cover the cloud and networking clusters; the two
into Detection Engineer cover the security-architecture cluster, which reaches
Cloud Security Engineer but never reached an analyst seat. All 38 roles now have
a route into all 7 fields. Five new comparison pages fell out of it
automatically, which is the site's own logic working: a new authored move is a
new pair worth comparing.

**And the other six fields were checked the same way.** No stranded roles
anywhere: every role reaches every field, furthest 5 moves. No field rests on a
single move either — removing any one authored move leaves all 38 roles able
to reach all 7 fields, so nothing else is one edit away from the Data situation.
Three asymmetries showed up and all three are the honest answer, not bugs:
Support & Operations has 17 moves out and 3 in (people leave the help desk and
do not go back), Cloud has no entry-level role (the industry does not have one),
and three first-job roles have no inbound moves (they are where people start).
Technologies, certifications and comparisons all have full role coverage, and no
role is a dead end.

That audit is now `scripts/audit-map.mjs` / `npm run audit:map`, in the same
shape as the link sweep: not a build gate, because most of what it reports needs
a human to judge, but a thing to run after editing roles. It exits non-zero only
on a true break.

**Guarded per field, not per role.** `graph-data.json.ts` already asserted that
every role is reachable from a first job. That check passed throughout, because
nothing was isolated — a whole field was. The new assertion walks outward from
every role and fails the build if any field has no authored route from it.
Proven by removing the six moves: *"no authored route into Data from 19
role(s): network-engineer, network-administrator, …"* — the exact 19. Restored,
build green.


---

## 22q. Half the canvas was empty (2026-09-24)

The map was being drawn into about a third of the window, and the role names
were arriving on screen at roughly six pixels. Three separate things were
causing that, and each one was multiplying the others.

**1. The map was lining up with the prose.** The drawing sat in the same
`max-w-6xl` reading column as the paragraphs above it, so on a 1900px window it
got 1152px and left 748px of page empty on either side. That symmetry is the
right instinct for text and the wrong one for a diagram: a reading column exists
to stop lines getting too long to follow, and nothing about 38 labelled roles is
helped by the constraint. The map section now uses `.nav-map-shell`
(`min(100%, 108rem)`) and the words keep their column.

**2. The detail panel was taking more than it needed.** `clamp(20rem, 27vw,
24.5rem)` is a comfortable column of text and, on a 1440 laptop, close to a
third of the canvas. Tightened to `clamp(19rem, 24vw, 23rem)`; the card reads
fine at 19rem.

**3. The SVG was letterboxing, and that was the big one.** The viewBox is about
1.8:1. Its container, once the panel had taken a column, was nearer square. An
SVG reconciles that with `xMidYMid meet` — it scales the drawing down to fit the
dimension it does *not* need and pads the other with nothing. Measured before
the fix: a 678x702 canvas containing a 678x380 drawing. **46% of the map's own
area was empty bands above and below it**, and every label had been scaled down
by the same factor that produced them.

This is the one that made the other two feel worse than they were. Widening the
box without fixing it would have given most of the new width straight back as
taller empty bands.

The fix is to stop treating the viewBox's proportions as fixed. `boxAspect()`
reads the element's real shape and every view calculation derives its height
from its width using that, so the drawing always fills the canvas exactly.
Letterboxing is now zero in every state — default, zoomed, fitted, panel open,
panel closed, full screen, phone — which is asserted directly in testing by
checking that the horizontal and vertical scale factors are equal.

It also fixes a bug nobody had reported. `svgPoint()` maps client coordinates as
though the viewBox filled the element, which under letterboxing it did not — so
dragging moved the map less than the cursor on whichever axis was being padded,
and ctrl+scroll zoomed toward a point slightly off the one under the pointer. It
felt like slight friction rather than a fault, which is why it survived. Making
the aspects agree makes that mapping exact.

**`reshape()` holds the magnification, not the framing.** When the box changes
shape — the panel opening, a window resize, entering full screen — the view
holds its vertical coverage and derives the width. That keeps the scale
constant: the panel takes a column of canvas and gives back the same map at the
same size, minus the strip it is standing on. Deriving it the other way rescales
the entire drawing every time a role is opened or closed, and a map that resizes
underneath you while you are reading it is worse than one that is slightly too
small. The single exception is the whole-map view on a tall, narrow window,
where there is no width to hold and the map is grown to fit rather than quietly
cropped.

**The type.** 12.5px to 14px — but the units here are the drawing's, not the
screen's, so what that is worth depends entirely on the scale above.
`CHAR_WIDTH` and `LABEL_HEIGHT` in `engine/layout.ts` had to move with it. They
are what the collision search uses to reserve space, and leaving them behind
would have left the layout believing names were smaller than they render: two of
them would eventually stack, and `assertLayoutLegible` would have agreed that
everything was fine. That is now said in a comment at both ends.

**Fit no longer zooms out further than Reset.** `fitTo()` pads by 140 units so a
couple of highlighted roles are not pressed against the edge. On a canvas this
wide and short, that padding alone made *Fit* with nothing selected show a
smaller map than *Reset* did — more empty margin than the whole drawing needs.
It is now clamped to the whole-map view.

Measured at 1900x1000, panel open, default zoom:

| | before | after |
|---|---|---|
| canvas | 678 x 702 | 1278 x 758 |
| drawing | 678 x 380 | 1278 x 758 |
| canvas area wasted | 46% | 0% |
| role name on screen | ~6px | 12.4px |

With the panel closed the canvas is 1662x758 and names are 13.5px. At 1440 it is
1359x682 closed and 998x682 open.

**What was tried and put back.** Raising the dock breakpoint from 64rem to
72rem, on the theory that around 1100px a docked panel costs more canvas than it
is worth. It does cost more than it is worth — but the overlay it falls back to
is taller than the canvas and covers the legend, and a panel sitting on the map
is the exact thing the dock was built to stop. Between 64 and 72rem the map is
simply cramped. That is the honest limit of a two-column instrument on a narrow
window, not something a breakpoint can argue away.

Phones are unchanged in kind: the whole map at 390px is a 3.5px label whatever
is done to it, which is why that case has always been pan-and-zoom and says so
in the markup.

## 23–26. Phases

**Shipped (MVP).** Everything above: 7 domains, 38 roles, 49 technologies, 55
capabilities, 41 scenarios, adaptive engine, results, explorer, inventory,
glossary, full local-first state. Builds clean, `astro check` reports 0 errors.

**Phase 2**

*Items 1 and 2 are now done — kept here with their outcomes because the reasoning
is the useful part.*

1. ~~Split role prose from role vectors.~~ **Done.** Role data was 117 KB
   minified, 51% of the client bundle, almost all of it prose the matcher never
   reads. `data/roles/cores.ts` now holds identity + vector and is the only role
   data the engine imports; the per-domain files hold page content. Shared chunk
   **227 KB → 132 KB raw, 49 KB → 28 KB brotli**, with the persona suite
   returning byte-identical results before and after.
2. ~~Fix the cloud+security persona.~~ **Done** — see the validation section.
3. ~~Per-role "try this in a weekend" hands-on trial.~~ **Done** — 12 trials,
   38/38 role coverage, build-enforced. See section 22b.
4. ~~Salary and market reality per role, sourced and dated like `/paths/` already
   does.~~ **Done** — 38/38 roles, 10 BLS anchors, build-enforced. See section 22c.
5. ~~Route the AI lab (`/navigator-lab`) output into the same role graph.~~
   **Done** — 22 field keys, 38/38 roles reachable, build-enforced. See section 22d.

*Phase 2 is complete.*

**Phase 3**
6. ~~Comparison view — two roles side by side on the same dimensions.~~
   **Done** — 106 pages, all 38 roles reachable, build-enforced. See section 22e.
7. ~~Visual career graph (SVG force layout) rather than adjacency lists.~~
   **Done** — 38 nodes, 86 edges, build-enforced legibility. See section 22f.
8. ~~Shareable result via URL fragment (encode answers in the hash — still no
   server).~~ **Done** — 128-char links, build-enforced codec. See section 22g.
9. ~~Military occupation → capability mapping, reusing the graph.~~
   **Done** — 26 occupations, 6 services, build-enforced. See section 22h.
10. ~~Progress tracking against a chosen path.~~ **Done** — 11 plans,
    per-section counts, build-enforced. See section 22i.

*Phase 3 is complete.*

---

## 27. Risks and mistakes to avoid

**Do not let the scenario bank drift back toward security.** It happened once
already. Exposure normalization protects the *scoring*, but it cannot manufacture
a choice that was never offered. Re-run the coverage audit when adding scenarios;
if a dimension has fewer than ~4 options, people shaped that way cannot express
it.

**Do not import `data/roles` from anything that runs in a browser.** That module
merges in every role's full page content. Client code — the engine, the results
renderer, any page `<script>` — must import `data/roles/cores`. This is the one
new failure mode the core/content split introduced, and it is silent: the code
works perfectly and the bundle quietly triples. It has already happened once, on
the results page, which imported the merged map purely to read `.name`.

**Do not add a role without a vector, or with a vector that is mid-high on
everything.** A broad, uniformly-strong vector correlates with everyone and
becomes a false attractor that shows up in every result. OT/ICS Security Engineer
is the closest to this line — watch it.

**Do not reveal per-dimension scoring during the assessment.** The progress
indicator is deliberately ambient. Showing "Security ●●●○○" mid-run teaches
people to steer, and then you are measuring their aspiration, not their
attraction.

**Do not make certifications the centre.** They are last on every role page for a
reason. The moment the tool recommends a certification before explaining the
career, it becomes the affiliate funnel it is trying not to be.

**Do not remove the honest downside.** Every role page carries its cost at the
same visual weight as its appeal. A career tool that only lists upsides is an
advertisement.

**Do not add "you are a…" language.** Attraction, not identity. This is the
single easiest thing to get wrong in a rewrite.

**Do not fake precision.** Three roles within two points are the same answer.
Say so.

**Do not give a `no-official-category` role a precise median.** The temptation is
constant, because a specific number looks more authoritative than a range, and
seventeen roles currently sit in that bucket. The build check exists because this
is exactly the kind of edit that looks like an improvement in review. If a role
genuinely gains an official occupation, move it to `bls-adjacent` with a real
anchor — do not invent the figure.

**Do not quote a median without entry pay beside it.** Enforced, for the same
reason the downside is enforced: the omission always flatters.

**Do not fix a thin capability list by widening capabilities.** The tags route
trials onto role pages. Adding roles to a capability until the numbers look
healthy makes every trial appear everywhere, which reads as generous and is
actually the same page repeated 38 times. The build bounds it at 55% of roles.
Add the tag that is true, or leave it.

**Do not add a single progress score.** Not "readiness", not "% complete", not
a combined number. Producing one requires deciding how many skills a
certification is worth, which nobody knows, and it would convert an honest
planning tool into a scoreboard that lies. Per-section counts only, and
in-progress stays separate from done.

**Do not turn the military page into a code lookup.** The capability picker is
the feature; the occupation list is a convenience that pre-fills it. Every
addition should keep it possible to get a full-quality answer without finding
your code at all, because codes get reorganised and this site will not always
notice when they do. Retired codes stay, labelled — a DD-214 does not update
itself.

**Do not reuse a scenario's numeric prefix.** Shared links address scenarios by
it. Deleting `d14-…` and later numbering a different scenario `d14-…` would make
every link already sent resolve to the wrong question, and the page would show a
confident, wrong result with nothing to indicate it. The build catches two
prefixes coexisting; it cannot catch reuse across time. Retire numbers, do not
recycle them.

**Do not put the inventory in the share link.** It stays on the device. If the
omission changes the ranking, say which role changes — do not fix the mismatch by
including it.

**Do not let the career map degrade quietly.** The layout is generated, so a
broken drawing still deploys and still looks like a feature. `assertLayoutLegible`
is the only thing standing between "we added four roles" and a map whose labels
sit on the wrong circles. If it fails, the fix is space — a larger `K`, or field
anchors spread further apart — never a looser check.

**Do not generate a comparison page for every possible pair.** The pair rules
exist to keep every page worth having. Loosening the overlap threshold or the
per-role cap to "cover more" trades 106 useful pages for several hundred that
say nothing, and search engines read that shape as doorway pages. If a pair
genuinely deserves a page, author the adjacency on the role — that is the
mechanism, and it is a human decision on purpose.

**Do not let the model name anything the site then presents as fact.** The lab's
prose is generated; the roles, the trial and the safety scope are not. If a new
field is added to the reading, decide which side of that line it falls on before
writing the code. Adding a key to one of the two lists and not the other fails
the build on purpose — do not "fix" it by deleting the check.

---

## 28. Copy principles

Concrete over abstract ("It is 2:13 AM" not "Consider a scenario"). Honest over
encouraging ("almost never a first job"). Second person, present tense. No
"embark on your journey", no "unlock your potential", no "there are no wrong
answers" *as reassurance* — we say it once, factually, because it is literally
true of the scoring.

---

## 29. Accessibility

- **Glossary explainers are `<details>`, not hover tooltips.** Hover is unusable
  on touch and invisible to keyboard users, and this exists specifically for
  people who have never heard the word.
- **Explainers sit outside the option button.** Inside, every attempt to read a
  definition would also submit an answer — punishing exactly the beginners the
  feature is for.
- Focus moves to the new question heading (`tabindex="-1"`) on every advance, so
  screen-reader and keyboard users land on the content.
- Options are `<button aria-pressed>`; the question container is `aria-live`.
- Bars are `role="img"` with a text label — a static measurement read as one
  statement, not a live region.
- `prefers-reduced-motion` disables bar animation.
- All three themes (light / dark / high-contrast) work, because everything
  resolves through the existing `--cb-*` tokens.
- Never colour alone: node states carry text, log rows carry weight.
- Full no-JS fallback — the entire map, all 38 role pages and the technology
  graph are static HTML.

---

## 30. Mobile

- Topology chains stack vertically under 640px and flow horizontally above it;
  the connector rotates with them.
- Log tables scroll inside their own `overflow-x` container — **the page body
  never scrolls sideways**.
- Metrics use `auto-fit` grid; role and domain grids collapse 3→2→1.
- Options are full-width, ≥44px tall, one per row — thumb-sized on every screen.
- The assessment is a single column with no horizontal affordances at all.
