# Navigator Question Bank v2 — DRAFT FOR CED'S EDIT

**Status: draft. Nothing here is live.** This is a full replacement candidate for the `Q` array in
`public/navigator-app.html` (around line 641), written in the "what I wish someone had asked me"
spirit you described — and fixing the two structural problems your own test run exposed:

1. **Route/switch vs. field/cabling are now separated.** The old bank read "hands-on + fix-it"
   as one blob, which is how your L2/L3 interest got scored as cabling. New questions distinguish
   *tracing why the path broke* (NOC) from *physically building the plant* (FLD/RF).
2. **Cyber's instincts are probed directly** — the watchdog/adversary questions (Q10, Q16) exist
   because your NSR answer proved that "expose it / who's positioning" thinking is real signal the
   old bank never caught.

**How to edit:** change any `p:` (question text), `l:` (option label), or `why:` (the "why it
matched" line users see in results). Keep `id`, `t`, and the weight objects unless you want scoring
changes — weights point at path-codes (SUP NOC SYS ARC CLD DVO AUT DEV QA DAN DEN DBA SOC GRC IAM
SEC DFR TPM BA TWR FLD RF), which roll up into the 10 families. `w:` adds points, `n:` subtracts.
When you're happy, hand it back and I'll wire it in, sanity-check the weight balance across all 10
families, and re-verify the engine end-to-end before deploy.

---

```js
var Q = [
  // ─────────────────────────────────────────────────────────────
  { s:"How you're wired", note:"Straight answers beat impressive ones. Nobody's grading you." },

  { id:"U01", t:"slider",
    p:"Something you own breaks — no warranty, no manual. How much of you WANTS it to be broken, just so you get to figure out why?",
    why:"a broken thing is a puzzle to you, not a chore",
    w:{SUP:2,NOC:2,DFR:1,QA:1,SYS:1} },

  { id:"U02", t:"slider",
    p:"You fixed it. How much does it bother you if you don't understand WHY the fix worked?",
    why:"you need the why, not just the win",
    w:{NOC:2,DFR:2,DEV:1,DAN:1,ARC:1} },

  { id:"U03", t:"slider",
    p:"How much do you enjoy taking a pile of messy information — notes, receipts, files, whatever — and turning it into something organized you could hand to someone else?",
    why:"you bring order to chaos and like doing it",
    w:{DAN:2,DBA:2,GRC:1,TWR:1,BA:1} },

  { id:"U04", t:"slider",
    p:"Assembling things with your hands — furniture, PC builds, mounting a TV properly. How much is that genuinely fun rather than a task?",
    why:"physical building is fun for you, not a chore",
    w:{FLD:2,RF:2,SUP:1}, n:{DEV:1,DAN:1} },

  { id:"U05", t:"slider",
    p:"A package tracking page says 'out for delivery' for three days. How much do you want to know exactly WHERE it is and what route it's stuck on — not just when it'll arrive?",
    why:"you trace paths — you want to know where things ARE and why they move the way they do",
    w:{NOC:2,DFR:1,DAN:1} },

  { id:"U06", t:"slider",
    p:"You do the same annoying multi-step task for the third time this week. How strong is the urge to build something so you NEVER do it by hand again?",
    why:"repetition offends you — you automate it away",
    w:{AUT:2,DVO:2,DEV:1,SYS:1} },

  { id:"U07", t:"slider",
    p:"Someone shows you their 'finished' work. How naturally do your eyes go straight to the one thing that's off?",
    why:"you catch what everyone else missed",
    w:{QA:2,DBA:1,DFR:1,SEC:1,DAN:1} },

  { id:"U08", t:"slider",
    p:"How much do you enjoy explaining something confusing until you actually SEE it click for the other person — not just finish the explanation?",
    why:"the click in someone else's eyes is the payoff for you",
    w:{SUP:2,TWR:1,TPM:1,BA:1} },

  { id:"U09", t:"slider",
    p:"Rules exist and somebody has to make sure things actually follow them. How much would you enjoy being the one nothing slips past?",
    why:"you're wired for safeguards — nothing gets by you",
    w:{GRC:2,IAM:2,SEC:1,QA:1} },

  { id:"U10", t:"slider",
    p:"You notice something wrong that nobody else has flagged — a scam pattern, a story that doesn't add up, a risk everyone's walking past. How strong is the pull to dig in and EXPOSE it?",
    why:"you have the watchdog instinct — find it, prove it, warn people",
    w:{SOC:2,DFR:2,SEC:1,DAN:1} },

  // ─────────────────────────────────────────────────────────────
  { s:"A little curiosity", note:"No tech background needed — just how these actually sound to you." },

  { id:"T01", t:"slider",
    p:"When an app does something instantly — money moves, a photo uploads across the world — how often do you catch yourself wondering what actually just happened underneath?",
    why:"you're curious what's under the hood",
    w:{DEV:1,NOC:1,CLD:1,DFR:1,ARC:1,DAN:1} },

  { id:"T02", t:"slider",
    p:"How appealing is this: you write exact instructions once, and a machine does the job perfectly, every time, forever?",
    why:"you're drawn to commanding machines with precision",
    w:{DEV:2,AUT:2,DVO:1,DEN:1} },

  { id:"T03", t:"slider",
    p:"Someone hands you a spreadsheet with a thousand rows and says 'something interesting is in here.' Honest reaction — dread or treasure hunt?",
    why:"data is a treasure hunt to you",
    w:{DAN:2,DEN:1,DBA:1,BA:1} },

  { id:"T04", t:"slider",
    p:"Two computers talk to each other across the planet in under a second. How much do you want to understand the PATH — every hop that message took to get there?",
    why:"the invisible paths between machines fascinate you",
    w:{NOC:2,ARC:1,CLD:1}, n:{FLD:0} },

  // ─────────────────────────────────────────────────────────────
  { s:"In real life", note:"Pick what you'd ACTUALLY do — not what sounds best." },

  { id:"S01", t:"choice",
    p:"Your group is planning a trip. Which role do you fall into without anyone asking?",
    o:[
      { l:"The one with the shared doc, the schedule, and the deposits collected", w:{TPM:2,BA:1,GRC:1}, why:"you naturally organize people toward a plan" },
      { l:"The one who researched every option and knows the trade-offs cold", w:{DAN:2,BA:1,DFR:1}, why:"you're the one who does the homework" },
      { l:"The one who handles the real-world logistics — bookings, gear, making it happen", w:{SUP:1,SYS:1,NOC:1,FLD:1}, why:"you make things actually happen" } ] },

  { id:"S02", t:"choice",
    p:"You inherit something with zero instructions — a hobby, a task at work, a machine. Honestly, that feels…",
    o:[
      { l:"Great. Figuring it out from scratch IS the fun part", w:{DEV:2,DAN:1,ARC:2,SEC:1,DFR:1}, why:"open-ended problems energize you" },
      { l:"Fine, once I find a guide or someone who's done it before", w:{SUP:1,TPM:1,QA:1}, why:"you like a trail map, then you move fast" },
      { l:"Honestly stressful — give me clear steps and I'll execute them perfectly", w:{SUP:1,FLD:2,GRC:2,DBA:1}, why:"you do your best work with clear direction" } ] },

  { id:"S03", t:"choice",
    p:"End of a genuinely good day. What happened?",
    o:[
      { l:"Something was broken and I got it working again", w:{SUP:2,NOC:1,SYS:1,FLD:1}, why:"fixing what's broken is your win condition" },
      { l:"I built something that didn't exist this morning", w:{DEV:2,DVO:1,ARC:1,AUT:1}, why:"you measure days by what you built" },
      { l:"I finally cracked the thing nobody could figure out", w:{DFR:2,DAN:2,SOC:1,QA:1}, why:"solving the unsolvable is your fuel" },
      { l:"Everything ran smooth and nobody even noticed my work — perfect", w:{SYS:2,NOC:1,DBA:1,IAM:1,GRC:1}, why:"invisible reliability is your craft" } ] },

  { id:"S04", t:"choice",
    p:"A friend's laptop 'is being weird.' What actually happens next?",
    o:[
      { l:"I take it and start eliminating causes one by one until I find it", w:{SUP:2,NOC:1,DFR:1}, why:"you troubleshoot by instinct, not luck" },
      { l:"I ask them exactly what changed right before it started", w:{DFR:2,SOC:1,QA:1,BA:1}, why:"you investigate before you touch anything" },
      { l:"I back up their files first — THEN we experiment", w:{DBA:2,GRC:1,SYS:1,IAM:1}, why:"you protect first, fix second" },
      { l:"Honestly? I'd rather help them buy the right replacement", w:{TPM:1,BA:1}, n:{SUP:1}, why:"advising beats repairing for you" } ] },

  { id:"S05", t:"choice",
    p:"Some jobs pay more because you're on the hook when things break at 2 AM. Straight answer:",
    o:[
      { l:"Pay me — I'll take the pager", w:{NOC:2,SYS:2,DBA:1,DVO:2,SOC:1}, why:"you'll trade sleep for stakes and pay" },
      { l:"Occasionally, for the right role", w:{}, why:"" },
      { l:"No. My off-hours are not for sale", w:{DEV:1,DAN:1,TWR:1,GRC:1,QA:1}, n:{NOC:2,SYS:2,DVO:2,SOC:1}, why:"you protect your hours — plan around it" } ] },

  // ─────────────────────────────────────────────────────────────
  { s:"Trade-offs", note:"Both options are respectable. One is more you." },

  { id:"F01", t:"forced",
    p:"Your ideal workday is…",
    o:[
      { l:"Around people — helping, coordinating, talking things through", w:{SUP:1,TPM:1,BA:1,TWR:1}, why:"people give you energy" },
      { l:"Heads-down — long stretches alone with a hard problem", w:{DEV:1,SYS:1,DAN:1,SEC:1,DFR:1}, why:"deep focus gives you energy" } ] },

  { id:"F02", t:"forced",
    p:"Which one is more you?",
    o:[
      { l:"Build the fence at the top of the cliff", w:{GRC:1,IAM:1,ARC:1,QA:1}, why:"you'd rather prevent the fall" },
      { l:"Be the ambulance when someone goes over", w:{NOC:1,SUP:1,SOC:1,DFR:1}, why:"you're built for the emergency" } ] },

  { id:"F03", t:"forced",
    p:"Pick your poison:",
    o:[
      { l:"A steady craft I get scary-good at over years", w:{DBA:1,GRC:1,FLD:1,SUP:1}, why:"mastery through repetition is your road" },
      { l:"A moving target that never lets me coast", w:{DEV:1,SEC:1,CLD:1,DAN:1,NOC:1}, why:"you need the target to keep moving" } ] },

  { id:"F04", t:"forced",
    p:"A system fails mysteriously. Which half of the mystery do you want?",
    o:[
      { l:"WHERE it broke — trace the path, find the hop that failed", w:{NOC:2,SYS:1}, why:"you hunt the break in the path" },
      { l:"WHO or WHAT caused it — trace the actor, find the story", w:{SOC:2,DFR:1}, why:"you hunt the actor behind the event" } ] },

  // ─────────────────────────────────────────────────────────────
  { s:"Your instincts", note:"Across any kind of work — most like you, then least." },
  { id:"R01", t:"rank6", p:"Across any kind of work — which of these feels most like you, and which feels least?" },

  // ─────────────────────────────────────────────────────────────
  { s:"Your situation", note:"These shape what's realistic to start NOW — they never remove a path." },

  { id:"C01", t:"constraint", p:"What could you realistically spend on learning in the next 6 months?", meta:true, o:[
      { l:"$0 — free only", w:{} }, { l:"Under $150", w:{} }, { l:"Up to $500", w:{} }, { l:"Whatever it takes", w:{} } ] },

  { id:"C02", t:"constraint", p:"Being out in the field — sites, buildings, weather — versus one desk:", o:[
      { l:"Get me OUT — I'd go crazy at one desk", w:{FLD:2,RF:2,SUP:1} },
      { l:"A mix sounds right", w:{} },
      { l:"One good desk, thanks", w:{DEV:1,DAN:1,BA:1,QA:1}, n:{FLD:2,RF:2} } ] },

  { id:"C03", t:"constraint", p:"How important is working from home?", o:[
      { l:"Non-negotiable", w:{DEV:1,DAN:1,QA:1,TWR:1,GRC:1,CLD:1}, n:{FLD:2,RF:2} },
      { l:"Strong preference", w:{DEV:1,DAN:1,QA:1} },
      { l:"Don't care either way", w:{} } ] },

  // ─────────────────────────────────────────────────────────────
  { s:"How ready you feel", note:"Belief, not skill. Feeling unsure NEVER removes a path — it flags one worth testing." },

  { id:"CF01", t:"confidence", p:"With real study time, how confident are you that you could get good with data and numbers?", conf:"data" },
  { id:"CF02", t:"confidence", p:"With real study time, how confident are you that you could learn to write working code?", conf:"code" },
  { id:"CF03", t:"confidence", p:"When you hit a wall nobody can help you with, how confident are you that you'll get over it anyway?", conf:"general" },

  // ─────────────────────────────────────────────────────────────
  { s:"One thing to avoid", note:"What you'd hate tells us as much as what you'd love." },

  { id:"N01", t:"negative", p:"Which of these would make you quit a job fastest?", o:[
      { l:"2 AM emergency pages on the regular", n:{NOC:2,SYS:2,DBA:2,DVO:2,SOC:1} },
      { l:"Frustrated people, all day, every day", n:{SUP:2,FLD:2,TPM:1} },
      { l:"Weeks alone with barely a conversation", n:{DEV:2,AUT:2,DAN:1} },
      { l:"The same exact routine until retirement", n:{SUP:1,DBA:2,FLD:2,GRC:1} },
      { l:"Paperwork, process, and sign-offs for everything", n:{GRC:2,IAM:2,TPM:1} } ] }
];
```

---

## What changed vs the live bank, and why

| Change | Why |
|---|---|
| **U05 (package tracking) + T04 (the path) + F04 (where vs who) are new** | The logical-networking signal the old bank never had — this is what separates route/switch from cabling. Your own result was the proof it was missing. |
| **U10 (watchdog/expose) is new** | Your NSR answer: "why is nobody reporting this / I wanted to expose it" is real threat-intel signal. The old bank had no question that could hear it. |
| **U04 (hands-on) narrowed to FLD/RF only** | It used to feed NOC too — that's the exact collision that mis-scored you. Physical building now points only at physical careers. |
| **S04 (friend's laptop) is new** | Replaces a weaker question; the four options separate troubleshooter / investigator / protector / advisor instincts in one shot. |
| **Every `p:` rewritten in second person, concrete-scene form** | "You do the thing — what happens next?" reads like a mentor asking, not a survey item. Feel-real was the directive. |
| **Sliders cut from 12 to 10, one rank, 27 total → 27 total** | Same count, better coverage. Question count parity means zero engine changes needed. |

## Notes for your edit pass
- The `why:` strings appear verbatim in results under "Why it matched" — they're worth your voice most of all.
- If you add/remove questions, keep rough weight balance per family (each family should be reachable by 4+ questions) — I'll verify the math when wiring.
- Anything you hate, delete; anything missing, write it rough and I'll format it.
