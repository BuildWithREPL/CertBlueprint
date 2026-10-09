import type { Trial } from '../types';
import { CAPABILITY_BY_SLUG } from './capabilities';

/**
 * Weekend trials — three to start with, deliberately.
 *
 * Authoring rules:
 *  1. Fully local and genuinely free. No account, no credit card, no free tier
 *     that will rot in eight months and leave a dead link on a career page.
 *  2. Uses tools the person already has. An install is a barrier, and barriers
 *     are where people quietly give up.
 *  3. Every destructive-ish step is reversible, and says so IN the step — dry
 *     run first, work on a copy, undo at the end.
 *  4. Security trials are scoped to the user's own machine, in writing.
 *  5. The objective describes a feeling, not a learning outcome. "Find out
 *     where your traffic goes" beats "understand ICMP".
 */
export const TRIALS: Trial[] = [
  {
    slug: 'follow-a-packet',
    name: 'Follow a packet',
    objective:
      'Find out where your own traffic actually goes on its way out of the building — and what it looks like when it stops arriving.',
    time: '45–70 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote: 'Built-in commands only. Nothing to install, no account, nothing to sign up for.',
    capabilities: ['packet-analysis', 'network-troubleshooting', 'routing'],
    safety:
      'Everything here runs against your own machine and connections you already make. Do not trace, scan or probe networks you do not own or have written permission to test — in many countries that is a criminal offence, not a grey area.',
    steps: [
      {
        title: 'Watch a name turn into an address',
        detail:
          'Every connection starts by looking up a name. Run this against a site you use daily, then against a site in another country. Notice you get different addresses — sometimes several.',
        commands: [
          { platform: 'Windows', run: 'nslookup bbc.co.uk' },
          { platform: 'macOS', run: 'dig bbc.co.uk +short' },
          { platform: 'Linux', run: 'dig bbc.co.uk +short' },
        ],
      },
      {
        title: 'Trace the path out',
        detail:
          'This lists every router your traffic passes through to reach that address. Read the hostnames down the left — you can usually see it leave your house, reach your provider, and cross into a backbone network.',
        commands: [
          { platform: 'Windows', run: 'tracert bbc.co.uk' },
          { platform: 'macOS', run: 'traceroute bbc.co.uk' },
          { platform: 'Linux', run: 'traceroute bbc.co.uk' },
        ],
      },
      {
        title: 'Find where the time goes',
        detail:
          'Look at the millisecond figures. Somewhere there is a jump — 8ms to 90ms between two hops. That jump is usually the moment your traffic goes long-distance. Now trace somewhere far away and compare where the jump happens.',
      },
      {
        title: 'Break it on purpose, then put it back',
        detail:
          'Add a line to your hosts file pointing a site you use at 127.0.0.1, and try to load it. Watch how the failure looks from the browser — the error will not tell you what you just did. Then delete the line. This is the single most useful thing on this list: you have now seen a name-resolution fault from the user\'s side, which is what half of all "the internet is down" tickets actually are.',
        commands: [
          { platform: 'Windows', run: 'notepad C:\\Windows\\System32\\drivers\\etc\\hosts   (run as Administrator)' },
          { platform: 'macOS', run: 'sudo nano /etc/hosts' },
          { platform: 'Linux', run: 'sudo nano /etc/hosts' },
        ],
      },
      {
        title: 'Optional — watch the actual conversation',
        detail:
          'If you want to go further, install Wireshark, capture for ten seconds while loading one page, and filter for "http" or "dns". You will see the individual messages between your machine and the server. This is the one step that needs an install, which is why it is last.',
      },
    ],
    enjoyedIf: [
      'You kept going past step three without being told to',
      'The latency jump made you want to know exactly where that hop was',
      'You found the deliberate breakage satisfying rather than pointless',
      'You wanted to know why a hop showed asterisks instead of a time',
    ],
    dislikedMeans:
      'If this felt like tedious bookkeeping, take that seriously. Networking and network security roles involve a great deal of exactly this — patient, methodical narrowing down, often at 2am. Finding it dull here is genuinely useful information, and it is much cheaper to learn it now than after a CCNA.',
  },

  {
    slug: 'read-your-own-logs',
    name: 'Read your own logs',
    objective:
      'Reconstruct what your computer did last night, from the record it kept without anyone asking it to.',
    time: '45–60 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote: 'Uses the log viewer already built into your operating system. Nothing to install.',
    capabilities: ['log-analysis', 'incident-triage', 'forensic-analysis'],
    safety:
      'Your own personal machine only. Do not do this on an employer\'s systems, or any system you do not personally own, without written authorisation — reading logs you are not authorised to read is a disciplinary matter at best and an offence at worst. That rule does not relax because you are curious or well-intentioned.',
    steps: [
      {
        title: 'Open the record',
        detail:
          'Your machine has been writing down what it does, continuously, for as long as you have owned it. Most people never look.',
        commands: [
          { platform: 'Windows', run: 'eventvwr.msc  →  Windows Logs  →  System' },
          { platform: 'macOS', run: 'Console.app  →  select your Mac under Devices' },
          { platform: 'Linux', run: 'journalctl -b --no-pager | less' },
        ],
      },
      {
        title: 'Find yourself in it',
        detail:
          'Locate the moment you logged in this morning. Note the exact timestamp and the event id. You have just done the core move of every investigation: anchoring to one known event so everything else can be measured against it.',
        commands: [
          { platform: 'Windows', run: 'Security log → filter Event ID 4624 (successful logon)' },
          { platform: 'Linux', run: 'journalctl -b | grep -i "session opened"' },
        ],
      },
      {
        title: 'Establish what normal looks like',
        detail:
          'Scroll a full day. Find three things that happen every single day at roughly the same time — an update check, a backup, a scheduled task. Write them down. This is baselining, and it is the skill that separates people who spot a real intrusion from people who chase noise for a year.',
      },
      {
        title: 'Find the one that only happened once',
        detail:
          'Now look for something that appears exactly once in the last week. A driver failure, an unexpected shutdown, a service that crashed. Read the surrounding twenty entries either side. Can you tell a story about what happened, and what happened next as a consequence?',
      },
      {
        title: 'Write the timeline',
        detail:
          'Pick five events, put them in order with timestamps, and write three sentences explaining what occurred. Show it to someone non-technical. If they understand it, you have just done the part of security work that most people are worst at — the writing, which is what actually gets acted on.',
      },
    ],
    enjoyedIf: [
      'You lost more time to it than you meant to',
      'Finding the once-only event felt like a small win',
      'You wanted to search for one identifier across the whole log to see where else it appeared',
      'Writing the timeline felt satisfying rather than like homework',
    ],
    dislikedMeans:
      'If the volume felt overwhelming and the payoff too thin, that is worth knowing before committing to security operations. A SOC analyst does this all day, mostly finding nothing, and the tolerance for that is either there or it is not. It is a completely reasonable thing not to have.',
  },

  {
    slug: 'make-the-computer-do-it',
    name: 'Make the computer do it',
    objective:
      'Do a genuinely boring task by hand, then arrange never to do it by hand again.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'PowerShell ships with Windows; bash ships with macOS and Linux. You already have everything you need.',
    capabilities: ['scripting-automation', 'config-management'],
    safety:
      'Work on a COPY of a folder, never your only copy of anything. Every step below dry-runs first and shows you what would happen before anything changes. If a step ever refuses to show you a dry run, that is the step to be suspicious of.',
    steps: [
      {
        title: 'Pick a real chore',
        detail:
          'Not a toy problem — something that genuinely annoys you. Sorting a Downloads folder full of four hundred files. Renaming photos to a consistent format. Finding every file over 500MB. It has to be real, or the payoff at the end will not land.',
      },
      {
        title: 'Do it by hand once, and time it',
        detail:
          'Actually time it. Write the number down. This is the figure you are going to beat, and it is also how you will one day justify automation work to a manager who wants to know why it is worth your afternoon.',
      },
      {
        title: 'Make a copy to work on',
        detail:
          'Duplicate the folder. Everything from here runs against the copy. This is not caution for beginners — it is what people do professionally, because the cost of being wrong is asymmetric.',
        commands: [
          { platform: 'Windows', run: 'Copy-Item -Path .\\Downloads -Destination .\\Downloads-copy -Recurse' },
          { platform: 'macOS', run: 'cp -R ~/Downloads ~/Downloads-copy' },
          { platform: 'Linux', run: 'cp -R ~/Downloads ~/Downloads-copy' },
        ],
      },
      {
        title: 'Ask what it WOULD do, before it does anything',
        detail:
          'Run the operation in preview mode first. Nothing changes; it just tells you what it intends. Read that output properly. This habit is the single biggest difference between someone safe to give automation to and someone who is not.',
        commands: [
          {
            platform: 'Windows',
            run: 'Get-ChildItem .\\Downloads-copy -File | Group-Object Extension | Format-Table Name, Count',
          },
          { platform: 'macOS', run: 'find ~/Downloads-copy -type f | sed "s/.*\\.//" | sort | uniq -c | sort -rn' },
          { platform: 'Linux', run: 'find ~/Downloads-copy -type f | sed "s/.*\\.//" | sort | uniq -c | sort -rn' },
        ],
      },
      {
        title: 'Now let it run',
        detail:
          'Sort every file into a folder named after its extension. Five lines or so. It will not work first time — read the error, change one thing, run it again. That loop, repeated, is the actual job.',
        commands: [
          {
            platform: 'Windows',
            run: 'Get-ChildItem .\\Downloads-copy -File | ForEach-Object { $d = ".\\Downloads-copy\\" + $_.Extension.TrimStart("."); New-Item -ItemType Directory -Force -Path $d | Out-Null; Move-Item $_.FullName $d }',
          },
          {
            platform: 'macOS',
            run: 'cd ~/Downloads-copy && for f in *.*; do d="${f##*.}"; mkdir -p "$d"; mv "$f" "$d"/; done',
          },
          {
            platform: 'Linux',
            run: 'cd ~/Downloads-copy && for f in *.*; do d="${f##*.}"; mkdir -p "$d"; mv "$f" "$d"/; done',
          },
        ],
      },
      {
        title: 'Compare it to your number',
        detail:
          'You wrote down how long it took by hand. It now takes under a second, and it will take under a second every time from now on. Sit with that for a moment — that gap, multiplied across an organisation, is the entire economic argument for automation as a career.',
      },
    ],
    enjoyedIf: [
      'The moment it worked felt genuinely good',
      'You immediately thought of a second chore to do this to',
      'Fighting the syntax felt like a puzzle rather than an obstacle',
      'You wanted to make it handle the awkward edge cases properly',
    ],
    dislikedMeans:
      'If twenty minutes of wrestling with quoting and syntax was pure frustration with no compensating satisfaction, that is a real signal. Automation, DevOps and platform roles are that experience repeatedly, and enjoying the puzzle is most of what makes them bearable. Plenty of excellent infrastructure people are not wired for it — they go deep on architecture or operations instead.',
  },
  {
    slug: 'declare-preview-destroy',
    name: 'Declare it, preview it, destroy it',
    objective:
      'Describe something in a file, watch a machine work out the difference between what you asked for and what exists, then tear it all down and rebuild it identically.',
    time: '60–80 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'One free single-file download (Terraform). No account, no cloud provider, no credit card, and nothing here can cost you money — you will be creating files on your own disk, not servers. Delete the binary afterwards if you like.',
    capabilities: ['iac', 'config-management', 'cloud-compute', 'container-orchestration'],
    safety:
      'This deliberately uses Terraform\'s local provider rather than a real cloud account. Every cloud tutorial that has you sign up with a card risks leaving something running and billing you months later — that is a genuinely common and expensive beginner experience, and it is not necessary to learn the loop.',
    steps: [
      {
        title: 'Get the tool',
        detail:
          'Download Terraform from terraform.io — it is a single executable. Put it somewhere on your PATH, or just work in the folder you downloaded it to. Check it runs.',
        commands: [{ platform: 'Any', run: 'terraform -version' }],
      },
      {
        title: 'Describe something that does not exist yet',
        detail:
          'Make a new empty folder and create a file called main.tf. You are not writing instructions here — you are describing a desired end state, and that distinction is the whole idea.',
        commands: [
          {
            platform: 'Any',
            run: 'terraform {\n  required_providers {\n    local = { source = "hashicorp/local" }\n  }\n}\n\nresource "local_file" "hello" {\n  filename = "${path.module}/out/hello.txt"\n  content  = "built by terraform\\n"\n}',
          },
        ],
      },
      {
        title: 'Ask what it WOULD do',
        detail:
          'Initialise, then run a plan. Read the output properly. It tells you exactly what will be created, changed or destroyed, and nothing has happened yet. This preview-before-acting habit is most of what separates infrastructure people who are safe from ones who are not.',
        commands: [{ platform: 'Any', run: 'terraform init\nterraform plan' }],
      },
      {
        title: 'Make it real',
        detail: 'Apply it. Look in the out/ folder — the file exists. Now run plan again: it reports no changes, because reality already matches your description.',
        commands: [{ platform: 'Any', run: 'terraform apply\nterraform plan' }],
      },
      {
        title: 'Break reality and watch it notice',
        detail:
          'Delete the file it made, by hand. Run plan again. It has detected drift — reality no longer matches the description — and it tells you precisely how to get back. Apply again and it repairs itself. This is the moment the idea usually lands.',
        commands: [{ platform: 'Any', run: 'terraform plan\nterraform apply' }],
      },
      {
        title: 'Add three more, then destroy everything',
        detail:
          'Change the resource to create three files instead of one using count = 3. Plan, apply. Then run destroy: everything it made is gone, and only your description remains. You can rebuild it identically, forever, from four lines of text. That property is what the whole cloud industry is built on.',
        commands: [{ platform: 'Any', run: 'terraform destroy' }],
      },
    ],
    enjoyedIf: [
      'The drift detection in step five genuinely impressed you',
      'You immediately wanted to know what else could be described this way',
      'Reading the plan output felt reassuring rather than tedious',
      'You liked that the description, not the result, is the thing you keep',
    ],
    dislikedMeans:
      'If the indirection annoyed you — all this ceremony to create a text file — that is worth noting. Cloud and platform engineering is largely this: describing systems rather than touching them, and trusting a tool to reconcile the difference. People who prefer direct, hands-on control over machines are often happier in systems or network engineering, where the thing you configure is the thing itself.',
  },

  {
    slug: 'fix-someones-problem',
    name: 'Fix someone’s problem',
    objective:
      'Take a vague, badly-described complaint from a real human being and turn it into something you can actually diagnose — then fix it and write it down.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'Needs one other person who is not technical, and a real problem they actually have. That is the only requirement, and it is the hard part.',
    capabilities: ['user-support', 'endpoint-management', 'os-administration'],
    safety:
      'You are working on someone else’s device, so ask permission explicitly and stay inside the problem you were asked to fix — do not browse their files, their messages or their history. Never ask for or type their password: have them enter it themselves, every time. If a fix would delete or move their data, stop and get their agreement first, in words, before you do it. These are the same boundaries a professional support role holds you to, and practising them now is part of the trial.',
    steps: [
      {
        title: 'Find a real complaint',
        detail:
          'Ask a family member, housemate or friend what annoys them about their computer or phone. Do not accept a technical description — you want the raw version. "It\'s slow." "The printer never works." "It keeps logging me out." That vagueness is the actual starting condition of the job.',
      },
      {
        title: 'Resist fixing it for ten minutes',
        detail:
          'This is the discipline the whole trial is built around. Ask questions instead. When did it start? What changed around then? Does it happen every time, or sometimes? Show me. Watch them do it — you will almost always see something they did not mention, because they did not know it mattered.',
      },
      {
        title: 'Reproduce it yourself',
        detail:
          'Make the problem happen on demand, with your own hands. If you cannot reproduce it, you cannot know you have fixed it — you can only know it has stopped happening for now, which is not the same thing and will come back.',
      },
      {
        title: 'Halve the problem, repeatedly',
        detail:
          'Is it that app or all apps? That network or all networks? That account or all accounts? Each answer eliminates half of what it could be. Keep going until only one thing is left. Notice how few questions this actually takes when you choose them well.',
      },
      {
        title: 'Fix it — then explain it without jargon',
        detail:
          'Make the fix. Then tell them what was wrong in language they understand, without being condescending and without pretending it was harder than it was. Watch their face. This skill is worth more to an early IT career than any certification, and almost nobody practises it deliberately.',
      },
      {
        title: 'Write the runbook',
        detail:
          'Five lines: the symptom, how to confirm it is this and not something else, the fix, and how to tell it worked. Written so someone else could follow it at 3am without ringing you. This is the artefact that turns a fix into an asset.',
      },
    ],
    enjoyedIf: [
      'Their relief when it worked genuinely felt good',
      'The ten minutes of questions was interesting rather than frustrating',
      'You enjoyed narrowing it down more than you enjoyed the fix itself',
      'You wanted to go and fix the three other things you noticed',
    ],
    dislikedMeans:
      'If the human part drained you — the vagueness, the explaining, the patience — that is important and completely legitimate. It does not mean IT is wrong for you; it means the front-line support route may not be the right door. Networking, systems and data roles all reach the same industry with far less of this, though almost all of them still involve some.',
  },
  {
    slug: 'ask-data-a-question',
    name: 'Ask data a question',
    objective:
      'Take a messy public dataset nobody prepared for you, find one true thing in it, and say that thing plainly — including what it does not prove.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'A spreadsheet is enough — Excel, Numbers, or free LibreOffice. There is an optional SQL path at the end if you want it. No account needed.',
    capabilities: ['query-analysis', 'data-pipelines', 'database-administration'],
    safety:
      'Use openly published data, and check the licence — most public portals permit reuse with attribution, some do not. Avoid datasets containing personal information about identifiable people; if you use your own records instead, such as a bank export, keep them local and do not paste them into an online tool to "quickly clean them up". Handling data carefully when nobody is watching is the actual professional standard here, not a formality.',
    steps: [
      {
        title: 'Get something real and unhelpful',
        detail:
          'Download a CSV from a public data portal — data.gov.uk, data.gov, or your national statistics office. Pick a subject you actually care about: crime near you, rainfall, energy prices, hospital waiting times. Deliberately do not pick a tutorial dataset. Real data is messy, and the mess is the job.',
      },
      {
        title: 'Write your question down before you look',
        detail:
          'One sentence, on paper, before you open the file. "Has burglary in my area gone up or down over five years?" Doing this first is what stops you finding whatever the data happens to show and calling it a finding afterwards.',
      },
      {
        title: 'Meet the mess',
        detail:
          'Open it. Find the problems: blank cells, dates in three formats, a total row hiding at the bottom that will corrupt every average you take, categories renamed halfway through the period. Write a list of every defect you find before you fix any of them.',
      },
      {
        title: 'Clean it, and keep a record of what you changed',
        detail:
          'Fix the defects — but write down each decision as you go. "Dropped 214 rows with no date." "Treated blank as zero." Those decisions change the answer, and being unable to say what you did to the data is the difference between analysis and guessing.',
      },
      {
        title: 'Answer the question',
        detail:
          'Pivot table, chart, or a formula. Get to a number. Then do the part almost everyone skips: try to disprove it. Is the trend just one anomalous year? Did the collection method change? Would a different but equally reasonable cleaning decision have flipped the result?',
        commands: [
          {
            platform: 'Any',
            run: 'Optional SQL path — sqlite3 ships with macOS and Linux:\n\nsqlite3 data.db\n.mode csv\n.import yourfile.csv t\nSELECT year, COUNT(*) FROM t GROUP BY year ORDER BY year;',
          },
        ],
      },
      {
        title: 'Say it in three sentences',
        detail:
          'What you found, how confident you are, and what it does not tell you. Show it to someone who has not seen the data. If they ask a question you cannot answer, that is not a failure — that is you discovering the limit of your own finding, which is the most valuable output of the whole exercise.',
      },
    ],
    enjoyedIf: [
      'The cleaning was satisfying rather than infuriating',
      'You tried to disprove your own finding without being told to',
      'You wanted a second dataset to cross-check it against',
      'Stating the limits felt like rigour rather than weakness',
    ],
    dislikedMeans:
      'If the cleaning felt like pointless drudgery blocking the interesting part, be honest about that — because in real data work the cleaning IS most of the job, frequently eighty percent of it. Enjoying the answer but not the preparation usually points toward analyst-adjacent roles that consume prepared data rather than data engineering, which is almost entirely preparation.',
  },

  {
    slug: 'audit-your-own-access',
    name: 'Audit your own access',
    objective:
      'Work out exactly what your own accounts can reach, what could take them over, and how far the damage would spread if one fell — the same exercise, at smaller scale, as securing an organisation.',
    time: '60–75 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'Uses the account settings pages you already have. Nothing to install. You will likely also improve your own security materially, which is a decent side effect.',
    capabilities: ['authentication', 'authorization', 'identity-lifecycle', 'privileged-access', 'cloud-iam'],
    safety:
      'Your own accounts and nobody else’s — not a partner’s, not a parent’s, not an employer’s, even with informal permission. Accessing an account that is not yours is an offence in most jurisdictions regardless of intent or relationship, and "I was learning security" has never once worked as a defence.',
    steps: [
      {
        title: 'Find the account that owns all the others',
        detail:
          'Start at your main email. Now list every service that would send a password reset there. That is not a list of accounts — it is a list of things someone gets for free the moment they take that one. Security people call this blast radius, and it is the single most useful concept in identity work.',
      },
      {
        title: 'Check what is actually guarding it',
        detail:
          'Look at the security settings of that email account. Is there a second factor? Is it SMS — which is interceptable — or an app or hardware key? Now check the recovery options: an old phone number or a disused backup address is a back door that bypasses everything else you just checked.',
      },
      {
        title: 'Review what you have handed out',
        detail:
          'Find the third-party access page on your Google, Microsoft or Apple account — the list of apps you signed in to using it. Most people have twenty to eighty entries and recognise perhaps half. Read what each was granted. Some will have read access to your entire mailbox from a service you used once in 2019.',
        commands: [
          { platform: 'Any', run: 'Google:    myaccount.google.com/permissions' },
          { platform: 'Any', run: 'Microsoft: account.microsoft.com/privacy → apps and services' },
          { platform: 'Any', run: 'Apple:     appleid.apple.com → Sign in with Apple' },
        ],
      },
      {
        title: 'Revoke, and notice how that feels',
        detail:
          'Remove everything you do not currently use. Notice the hesitation — "what if something breaks?" That exact hesitation, multiplied across ten thousand employees and twenty years, is why organisations accumulate permissions nobody dares remove. You are feeling the central problem of identity engineering firsthand.',
      },
      {
        title: 'Check the sessions still open',
        detail:
          'Most services list active sessions and signed-in devices. Look for a device you no longer own or a location you do not recognise. Sign them all out. Note how many services do not offer this at all — that absence is itself a finding.',
      },
      {
        title: 'Write the one-page assessment',
        detail:
          'What is your most valuable account? What is the weakest path into it — is it the password, the second factor, the recovery method, or an app you granted access to years ago? What would you fix first if you had one hour? That prioritised write-up is exactly the deliverable an identity or GRC role produces, and doing it for yourself is the cheapest possible practice.',
      },
    ],
    enjoyedIf: [
      'The blast-radius idea in step one genuinely landed',
      'You found at least one granted permission that alarmed you',
      'You enjoyed the systematic sweep more than you expected',
      'You started thinking about how this would scale to ten thousand people',
    ],
    dislikedMeans:
      'If this felt like fussy admin — a checklist with no puzzle in it — that is a real signal about identity, access and governance work, which is substantially careful, repetitive, high-consequence bookkeeping. People who want the adversary and the chase are usually better suited to detection, response or offensive roles, where the same rigour is applied to a moving target.',
  },
  {
    slug: 'find-what-is-exposed',
    name: 'Find what’s exposed',
    objective:
      'Discover what is actually listening on your own network — including the things you had no idea were there — and work out which of them would matter.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote: 'Nmap is free and open source. One install, no account, available for every platform.',
    capabilities: ['recon-enumeration', 'vulnerability-scanning', 'device-profiling'],
    safety:
      'Scan ONLY your own home network, and only devices you personally own. There is exactly one external exception below — scanme.nmap.org, which the Nmap Project publishes specifically so people can practise, and which should be scanned a couple of times, not hammered. Everything else is off limits: not your employer, not your university, not a friend\'s network with verbal permission, not a website "just to see". Unauthorised scanning is a criminal offence in the UK, the US, and most of Europe, and the fact that you were curious rather than malicious is not a defence anyone has successfully run. If you are ever unsure whether you have permission, you do not have permission.',
    steps: [
      {
        title: 'Establish what your own network is',
        detail:
          'Find your own address and the range your network occupies. You need to know precisely what you own before you touch anything, and getting this wrong is how people accidentally scan their neighbour or their ISP.',
        commands: [
          { platform: 'Windows', run: 'ipconfig' },
          { platform: 'macOS', run: 'ifconfig | grep "inet "' },
          { platform: 'Linux', run: 'ip addr' },
        ],
      },
      {
        title: 'Find out what is actually on it',
        detail:
          'A ping sweep of your own range. Count the results. Almost everyone finds more than they expected — a thermostat, a TV, a printer they thought was off, a doorbell, a device they cannot identify at all. That last category is the interesting one.',
        commands: [{ platform: 'Any', run: 'nmap -sn 192.168.1.0/24        # adjust to YOUR range from step 1' }],
      },
      {
        title: 'Identify the one you cannot name',
        detail:
          'Pick the device you could not identify. Ask what it is — services, guessed operating system, vendor from its hardware address. Then go and physically find it in your home. This is device profiling, and it is precisely what a network access control system does automatically, all day, at enterprise scale.',
        commands: [{ platform: 'Any', run: 'nmap -A 192.168.1.42          # the unknown device on YOUR network' }],
      },
      {
        title: 'Practise against the one legal target',
        detail:
          'The Nmap Project runs scanme.nmap.org for exactly this purpose. Scan it once or twice — not repeatedly — and compare what a deliberately exposed host looks like against your own devices. Read the open ports and ask what each one is for.',
        commands: [{ platform: 'Any', run: 'nmap -A scanme.nmap.org' }],
      },
      {
        title: 'Ask the question that actually matters',
        detail:
          'You now have a list of open ports. A scanner will tell you what is open; it will never tell you whether it matters. For each finding ask: is it reachable from outside my house, what would someone get if they took it, and is there a reason it is on at all? That reasoning — exposure and impact, not severity scores — is the whole difference between running a tool and doing the job.',
      },
      {
        title: 'Write it up as if for someone else',
        detail:
          'Three findings, ranked by what you would fix first, with a sentence each on why. Include one you decided NOT to worry about, and say why. Being able to justify what you deliberately ignored is what separates a useful report from a wall of noise nobody acts on.',
      },
    ],
    enjoyedIf: [
      'Finding a device you did not know was there was a genuine thrill',
      'You wanted to keep pulling on what each open port was for',
      'Deciding what mattered was more interesting than running the scan',
      'You immediately thought about how this scales to ten thousand devices',
    ],
    dislikedMeans:
      'If the scanning felt like pressing a button and reading output someone else generated, that reaction is worth trusting. Offensive and vulnerability work is far more about the judgement in steps five and six — exposure, impact, prioritisation, writing — than about tooling. If the tool was the fun part and the reasoning was the chore, the day-to-day may disappoint you.',
  },

  {
    slug: 'write-a-detection',
    name: 'Write a detection',
    objective:
      'Define what normal looks like, write a rule that catches an exception to it, then find out how often your rule is wrong — which is the part nobody tells you about.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote: 'Your own machine’s logs and a command line. Nothing to install, no account.',
    capabilities: ['detection-engineering', 'siem-engineering', 'threat-hunting'],
    safety:
      'Your own personal machine only, exactly as with the log-reading trial. Do not run detections across systems you do not own or are not authorised to monitor.',
    steps: [
      {
        title: 'Pick something that should be rare',
        detail:
          'Choose one event that ought to happen occasionally but not constantly on your own machine: a failed login, a service crashing, a scheduled task failing, a USB device connecting. Rare-but-real is the sweet spot — common events make useless alerts and impossible events make rules you can never test.',
      },
      {
        title: 'Count it over thirty days',
        detail:
          'Before writing any rule, find out how often it actually happened. This number is your baseline, and skipping this step is the single most common reason real detections get switched off within a fortnight for being too noisy.',
        commands: [
          {
            platform: 'Windows',
            run: 'Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625; StartTime=(Get-Date).AddDays(-30)} -ErrorAction SilentlyContinue | Measure-Object | Select-Object Count',
          },
          { platform: 'Linux', run: 'journalctl --since "30 days ago" | grep -ci "authentication failure"' },
          { platform: 'macOS', run: 'log show --last 30d --predicate \'eventMessage CONTAINS "Failed"\' | wc -l' },
        ],
      },
      {
        title: 'Write the rule',
        detail:
          'Express your detection as something runnable — a filter, a grep, a query. Not pseudocode. It needs to actually execute so it can actually be wrong, which is the only way you will learn anything from it.',
        commands: [
          {
            platform: 'Windows',
            run: 'Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625; StartTime=(Get-Date).AddHours(-24)} -ErrorAction SilentlyContinue | Group-Object -Property @{e={$_.Properties[5].Value}} | Where-Object Count -ge 3',
          },
          { platform: 'Linux', run: 'journalctl --since "24 hours ago" | grep -i "authentication failure" | awk \'{print $NF}\' | sort | uniq -c | sort -rn | awk \'$1>=3\'' },
        ],
      },
      {
        title: 'Deliberately set it off',
        detail:
          'Trigger the thing yourself — mistype your own password four times, plug in a USB stick. Does the rule fire? A detection you have never seen fire is not a detection; it is a hypothesis. Astonishing numbers of production rules have never been tested this way.',
      },
      {
        title: 'Now find out how wrong it is',
        detail:
          'Run it across the full thirty days. Every hit that was not really an attack is a false positive — and every one of those, in a real SOC, costs a human being fifteen minutes. Calculate your rate. If it is above roughly one a day for one machine, imagine that multiplied by five thousand machines and ask whether anyone would keep it switched on.',
      },
      {
        title: 'Tune it once, and record what you gave up',
        detail:
          'Narrow the rule to cut the noise — raise the threshold, exclude a known-good source. Re-run it. Then write down what you can no longer catch as a result. Every tuning decision trades coverage for signal, and being unable to state what you traded away is how organisations end up blind in ways nobody has documented.',
      },
    ],
    enjoyedIf: [
      'Watching your own rule fire was satisfying',
      'The false-positive count made you want to fix the rule rather than abandon it',
      'You enjoyed the trade-off in the last step rather than finding it frustrating',
      'You started wondering what else you could baseline',
    ],
    dislikedMeans:
      'If the tuning loop felt like an endless treadmill with no clean answer, that is an accurate preview — detection engineering never reaches a finished state, and tolerance for permanent, incremental, never-quite-right work is what the role requires. Enjoying the investigation but not the rule-writing points toward analysis, hunting or response instead.',
  },
  {
    slug: 'break-your-own-app',
    name: 'Break your own app',
    objective:
      'Build a small thing that works, break it in sixty seconds using nothing but the address bar, then understand exactly why it broke and fix it properly.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'A text editor and a browser. No install, no server, no account — the page runs from a file on your desktop.',
    capabilities: ['exploitation', 'software-engineering', 'api-integration', 'ci-cd'],
    safety:
      'You are attacking a file you wrote, on your own machine, that nobody else can reach. Do not point any of this at a website you do not own — testing someone else\'s site without written authorisation is a criminal offence, and "it was only an alert box" has never made a difference to that. If you want a bigger target afterwards, OWASP Juice Shop exists specifically to be attacked legally.',
    steps: [
      {
        title: 'Build something that works',
        detail:
          'Save this as a file called app.html and open it in your browser. It is a greeting page that takes a name. Use it normally first — type your own name, see it work. Everything you build starts here: correct, for the input you imagined.',
        commands: [
          {
            platform: 'Any',
            run: '<!doctype html>\n<input id="n" placeholder="your name">\n<button onclick="go()">Greet</button>\n<div id="out"></div>\n<script>\nfunction go() {\n  const name = document.getElementById("n").value;\n  document.getElementById("out").innerHTML = "Hello, " + name + "!";\n}\n</script>',
          },
        ],
      },
      {
        title: 'Type something that is not a name',
        detail:
          'Now put this in the box instead and press the button. Something will happen that the author did not intend and did not anticipate. You have just done the fundamental move of application security: supplying input the designer never pictured.',
        commands: [{ platform: 'Any', run: '<img src=x onerror="alert(\'this is now my page\')">' }],
      },
      {
        title: 'Work out precisely why it worked',
        detail:
          'The code never asked for code — it asked for a name. But it glued your text into the page as markup rather than as text, so the browser did what browsers do and executed it. Sit with that: the flaw is not the alert box, it is that data and instructions were allowed to occupy the same channel. Nearly every major vulnerability class is a variation of that one sentence.',
      },
      {
        title: 'Escalate it',
        detail:
          'An alert box proves nothing to anyone. Change your payload so it reads something real from the page instead — the document title, a cookie you set yourself, the contents of another element. Proving actual impact rather than mere possibility is the difference between a finding a developer fixes and one they close as noise.',
        commands: [{ platform: 'Any', run: '<img src=x onerror="document.getElementById(\'out\').textContent = document.title">' }],
      },
      {
        title: 'Fix it — the right way and the wrong way',
        detail:
          'First fix it badly: filter out the word "script". Then defeat your own filter — the payload above never used that word. Now fix it properly by changing innerHTML to textContent, so the input is treated as text and can never be instructions. Try every payload again. This contrast, blocklist versus correct handling, is the single most useful lesson in the whole trial.',
        commands: [{ platform: 'Any', run: 'document.getElementById("out").textContent = "Hello, " + name + "!";' }],
      },
      {
        title: 'Go looking for the same shape elsewhere',
        detail:
          'Where else does something you have written take input and put it somewhere with meaning — a filename, a database query, a shell command, a URL? Write down three. You now have the pattern-recognition that application security work actually consists of, and it transfers to every language you will ever use.',
      },
    ],
    enjoyedIf: [
      'Beating your own bad filter in step five was the best part',
      'You immediately wanted to try payloads nobody suggested to you',
      'The data-versus-instructions idea reframed something for you',
      'You started mentally auditing code you have already written',
    ],
    dislikedMeans:
      'If the adversarial framing did not appeal — if you would rather have spent the ninety minutes making the page good than making it fail — that is a genuinely useful signal, and it points at development or platform work rather than security. The people who thrive in application security are the ones who cannot stop asking "but what if I send it something stupid".',
  },

  {
    slug: 'design-it-on-paper',
    name: 'Design it on paper',
    objective:
      'Map a real system you already own, decide what actually needs protecting, redesign it — and then be honest about what your design costs the people who have to live with it.',
    time: '60–75 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'Paper and a pen. Deliberately no tools — the constraint is the point, because architecture is thinking, not diagramming software.',
    capabilities: ['network-design', 'network-segmentation', 'risk-compliance'],
    safety:
      'Map your own home network only. Everything here is pen and paper, so nothing you do can affect a system — but do not extend the exercise by surveying, probing or diagramming a network you do not own, including an employer’s, however harmless drawing it feels.',
    steps: [
      {
        title: 'Draw what you actually have',
        detail:
          'Your home network, on one sheet. Router, every device, how each connects. If you did the exposure trial you already have the inventory; if not, list them from memory and then check — the gap between what you remembered and what is really there is itself the first finding, and it is the same gap every organisation has.',
      },
      {
        title: 'Draw the lines nothing crosses',
        detail:
          'Now mark what can reach what. On a normal home network the honest answer is everything reaches everything — your work laptop, your smart bulb, a guest\'s phone, the doorbell camera all sit in one flat space. Draw that reality, not the reality you would prefer.',
      },
      {
        title: 'Name the thing that actually matters',
        detail:
          'Of everything on that page, what would genuinely hurt to lose or have taken? Usually one or two things: the machine with your work on it, the drive with the family photos. Circle them. Everything else on the diagram exists, in security terms, mainly as a route toward those.',
      },
      {
        title: 'Pick the worst device and follow it',
        detail:
          'Choose the least trustworthy thing on the network — the cheapest smart device, the one that has not had a firmware update in three years. Trace, on the diagram, exactly what it can reach if someone takes it. That path is your blast radius, and drawing it is more persuasive than any risk score you could write down.',
      },
      {
        title: 'Redesign it, on a second sheet',
        detail:
          'Draw the version where that cannot happen. A separate network for untrusted devices. The important machine somewhere the doorbell cannot reach. Guest access that is genuinely separate. You do not have to build it — you have to be able to justify it.',
      },
      {
        title: 'Now write down what your design costs',
        detail:
          'This is the step that separates architecture from wishful thinking. What breaks? Casting to the TV probably stops working. Someone has to maintain two networks. A guest cannot print. Write the honest list, then decide which trade-offs you would actually accept and which you would not. If you cannot articulate the cost of your own design, you will lose every real architecture argument you ever have.',
      },
    ],
    enjoyedIf: [
      'Drawing the blast radius in step four was the moment it clicked',
      'You enjoyed arguing with yourself about the trade-offs',
      'You wanted to redraw it a third time to get it right',
      'Working without tools felt freeing rather than limiting',
    ],
    dislikedMeans:
      'If the abstraction frustrated you and you wanted to go and actually configure something, take that seriously — architecture roles are largely diagrams, documents and persuading people, with someone else doing the building. That preference for hands-on implementation is a strength, not a deficiency, and it points at engineering rather than architecture.',
  },
  {
    slug: 'walk-the-physical-layer',
    name: 'Walk the physical layer',
    objective:
      'Stop treating the network as an abstraction. Measure a real radio signal in a real building, find out where it dies and why, and put your hands on the hardware everything else runs on.',
    time: '60–90 minutes',
    cost: 'Free',
    barrier: 'local',
    barrierNote:
      'Built-in wireless tools plus your own feet. The optional hardware section needs a computer you own and are willing to open — no purchase required.',
    capabilities: ['wireless-rf', 'physical-infrastructure', 'storage-management'],
    safety:
      'For the hardware section: shut down fully, unplug from the mains, and hold a metal part of the case before touching components. Never open a power supply or a CRT — they store lethal charge even unplugged. Do not open equipment you rent, lease, or that belongs to an employer, and be aware that opening some laptops voids warranty. If in any doubt, do the wireless half and skip the rest; it is the smaller part of the trial.',
    steps: [
      {
        title: 'Measure what you have been assuming',
        detail:
          'Find your current signal strength, right now, where you are sitting. Note the number and the units — dBm is a negative figure where closer to zero is better, and −50 is excellent while −80 is barely usable.',
        commands: [
          { platform: 'Windows', run: 'netsh wlan show interfaces' },
          { platform: 'macOS', run: 'Hold Option, click the Wi-Fi menu — or open Wireless Diagnostics from Spotlight' },
          { platform: 'Linux', run: 'iw dev wlan0 link    # or: nmcli -f IN-USE,SSID,SIGNAL,CHAN dev wifi' },
        ],
      },
      {
        title: 'Walk the building and write numbers down',
        detail:
          'Take a reading in every room, and at the far corner of each. Write them on a rough floor plan. You are producing a coverage survey — the same artefact, at smaller scale, that a wireless engineer produces before a hospital or a warehouse deployment.',
      },
      {
        title: 'Find the wall that eats your signal',
        detail:
          'Look for the sharp drop, not the gradual fade. A gentle decline is distance; a cliff between two adjacent readings is something physical — a wall with foil-backed insulation, a mirror, a boiler, a fridge, a chimney. Go and identify the actual object. This is the moment radio stops being theoretical.',
      },
      {
        title: 'Discover you are not alone on the air',
        detail:
          'List the networks around you and the channels they occupy. Count how many are on the same channel as yours. Wi-Fi is a shared medium in a public commons — your neighbour\'s router degrades yours, and no configuration on your side can fully fix it. That constraint is the defining fact of wireless work.',
        commands: [
          { platform: 'Windows', run: 'netsh wlan show networks mode=bssid' },
          { platform: 'Linux', run: 'nmcli -f SSID,CHAN,SIGNAL dev wifi list' },
          { platform: 'macOS', run: 'Wireless Diagnostics → Window → Scan' },
        ],
      },
      {
        title: 'Trace one cable end to end',
        detail:
          'Pick any cable in your home — the one from the wall to the router. Follow it physically to both ends. Where does it enter the building, and what is on the other side of that wall? Almost nobody knows. Documenting exactly this, across a building, is a real job that real people are paid to do because the records are always wrong.',
      },
      {
        title: 'Optional — open something and name every part',
        detail:
          'Power off, unplug, ground yourself, then open a desktop or an old laptop you own. Identify: the processor and its cooler, the memory, the storage, the power supply, the fans. Trace where the air enters and leaves. Ask where the heat goes. Now imagine ten thousand of these in one room — that question of heat, power and airflow is most of what data centre design actually is.',
      },
    ],
    enjoyedIf: [
      'Finding the exact wall that killed the signal was satisfying',
      'You enjoyed being on your feet with a number in your hand',
      'The shared-medium constraint interested you rather than annoying you',
      'You wanted to open the case more than you wanted to read about it',
    ],
    dislikedMeans:
      'If the physicality felt like a chore — the walking, the writing down, the fiddling with hardware — that is worth knowing before pursuing wireless, field or data centre work, all of which are substantially physical jobs in real buildings, sometimes at height, in the cold, or at 4am. Plenty of superb network engineers want nothing to do with the physical layer and work entirely in routing and policy instead.',
  },
];

export const TRIAL_BY_SLUG: Record<string, Trial> = Object.fromEntries(TRIALS.map((t) => [t.slug, t]));

/**
 * Trials relevant to a role, resolved through the capability graph rather than
 * a hand-maintained per-role list — so adding one trial lights it up on every
 * role whose capabilities it exercises.
 */
export function trialsForRole(roleSlug: string): Trial[] {
  return TRIALS.filter((trial) =>
    trial.capabilities.some((slug) => CAPABILITY_BY_SLUG[slug]?.roles.includes(roleSlug)),
  );
}

/**
 * Build-time guard for trial content.
 *
 * Called from the trials page, so a regression fails the build rather than
 * shipping. The safety rule is the one that matters most: when this was first
 * run it caught three trials of my own that touched someone else's device,
 * network or data without a scope note. Content review catches that
 * inconsistently; a check does not.
 */
export function assertTrialIntegrity(): void {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const trial of TRIALS) {
    if (seen.has(trial.slug)) problems.push(`duplicate slug "${trial.slug}"`);
    seen.add(trial.slug);

    for (const cap of trial.capabilities) {
      if (!CAPABILITY_BY_SLUG[cap]) problems.push(`${trial.slug} → unknown capability "${cap}"`);
    }
    if (trial.capabilities.length === 0) {
      problems.push(`${trial.slug} has no capabilities — no role can ever reach it`);
    }
    if (trial.steps.length < 4) problems.push(`${trial.slug} has only ${trial.steps.length} steps`);
    if (!trial.dislikedMeans) {
      problems.push(`${trial.slug} has no "if you disliked it" — disliking must be a stated result`);
    }
    if (trial.enjoyedIf.length === 0) problems.push(`${trial.slug} has no enjoyedIf signals`);
    // Every trial so far is free and local. If that ever stops being true it
    // should be a deliberate decision someone makes by editing this check.
    if (!/free/i.test(trial.cost)) problems.push(`${trial.slug} is not free ("${trial.cost}")`);
    if (!trial.safety) problems.push(`${trial.slug} has no safety scope`);
    for (const step of trial.steps) {
      if (!step.title || !step.detail) problems.push(`${trial.slug} has a step missing title or detail`);
    }
  }

  if (problems.length) {
    throw new Error(`Navigator trials are broken:\n  ${problems.join('\n  ')}`);
  }
}

/** Role slugs that currently have at least one trial. Used for coverage checks. */
export function rolesWithTrials(): string[] {
  const slugs = new Set<string>();
  for (const trial of TRIALS) {
    for (const capSlug of trial.capabilities) {
      for (const role of CAPABILITY_BY_SLUG[capSlug]?.roles ?? []) slugs.add(role);
    }
  }
  return [...slugs].sort();
}
