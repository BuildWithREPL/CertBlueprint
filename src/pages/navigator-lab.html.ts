import template from '../lab/navigator-lab.html?raw';
import workerSource from '../../worker/index.js?raw';
import { LAB_FIELDS, assertLabFieldIntegrity } from '../lib/navigator/data/lab-fields';
import { ROLE_CORE_BY_SLUG } from '../lib/navigator/data/roles/cores';

/**
 * /navigator-lab — the conversational lab.
 *
 * The page itself is a hand-written standalone document (src/lab/), kept out of
 * BaseLayout on purpose: it is a focused writing surface with its own type and
 * palette. What this endpoint adds is everything that must NOT be hand-written:
 * the explainer below the conversation, built from the same field map the
 * reader resolves against and from the worker's own limits. If the worker's
 * model or turn cap changes, the copy follows — or the build stops and says why.
 *
 * Output is dist/navigator-lab.html, served at /navigator-lab exactly as the old
 * public/ file was.
 */

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function workerConst(name: string, pattern: RegExp): string {
  const match = workerSource.match(pattern);
  if (!match) throw new Error(`Navigator lab page: cannot read ${name} from worker/index.js — update src/pages/navigator-lab.html.ts.`);
  return match[1];
}

function fill(html: string, marker: string, content: string): string {
  const token = `<!--LAB:${marker}-->`;
  if (html.split(token).length !== 2) {
    throw new Error(`Navigator lab page: template must contain ${token} exactly once.`);
  }
  return html.replace(token, content);
}

export function GET() {
  assertLabFieldIntegrity();

  const model = workerConst('MODEL', /const MODEL = "([^"]+)"/);
  const maxTurns = Number(workerConst('MAX_TURNS', /const MAX_TURNS = (\d+)/));
  const maxMsgChars = Number(workerConst('MAX_MSG_CHARS', /const MAX_MSG_CHARS = (\d+)/));

  // The explainer names the model in plain words. A different model makes that
  // sentence false, so a model change has to come with a copy change.
  if (!model.startsWith('@cf/meta/llama-3.3-70b')) {
    throw new Error(`Navigator lab page: worker model is now ${model}; update the model description in navigator-lab.html.ts.`);
  }

  // The first message is sent as Q: "<opener>"\nA: <answer>. If the page lets
  // someone type right up to its limit, that wrapper must still fit under the
  // worker's per-message cap, or a long first answer fails with a vague error.
  const clientLimit = Number((template.match(/text\.length > (\d+)\)/) ?? [])[1]);
  const opener = (template.match(/<h1 class="q" id="question">([^<]+)<\/h1>/) ?? [])[1];
  if (!clientLimit || !opener) {
    throw new Error('Navigator lab page: cannot find the answer length check or the opening question in the template.');
  }
  const firstMessageMax = clientLimit + `Q: "${opener.trim()}"\nA: `.length;
  if (firstMessageMax > maxMsgChars) {
    throw new Error(
      `Navigator lab page: a first answer at the page limit (${clientLimit}) becomes ${firstMessageMax} characters, over the worker's MAX_MSG_CHARS (${maxMsgChars}).`,
    );
  }

  const followUps = maxTurns - 1;
  const covered = LAB_FIELDS.filter((f) => f.track === 'covered');
  const partial = LAB_FIELDS.filter((f) => f.track === 'partial');
  const none = LAB_FIELDS.filter((f) => f.track === 'none');

  const roleLinks = (slugs: string[]) =>
    slugs.map((slug) => `<a href="/navigator/roles/${esc(slug)}/">${esc(ROLE_CORE_BY_SLUG[slug]!.name)}</a>`).join(', ');

  const fieldItem = (f: (typeof LAB_FIELDS)[number]) => {
    const meta =
      f.track === 'covered'
        ? `Links to: ${roleLinks(f.roles)}`
        : `${esc(f.gap ?? '')}${f.roles.length ? ` Closest roles mapped here: ${roleLinks(f.roles)}.` : ''}`;
    return `<li class="${f.track}"><span class="fname">${esc(f.label)}</span><span class="fmeta">${meta}</span></li>`;
  };

  const explainer = `<div class="explain"><div class="in">

<section id="how-it-works" style="scroll-margin-top:1rem">
  <h2>How the Lab works</h2>
  <ol>
    <li><strong>You answer one open question</strong> in your own words — the rabbit-hole question above. A sentence or two is enough.</li>
    <li><strong>The reader may ask a follow-up</strong> — at most ${followUps}, one at a time. It is told not to place anyone from a vague first answer, so if what you wrote could point several ways, it asks the one question that would split them apart.</li>
    <li><strong>After at most ${maxTurns} answers, it gives a reading:</strong> what it heard you say, the field that fits, the honest road in, something to try this weekend, and a second direction when there genuinely is one.</li>
    <li><strong>The page then attaches real links.</strong> The reader has to name one of ${LAB_FIELDS.length} fixed fields, and the page looks that field up in CertBlueprint’s own data to show real role pages and a checked weekend trial.</li>
  </ol>
</section>

<section>
  <h2>What the AI writes — and what it doesn’t</h2>
  <p>The reader is an AI language model — Meta’s Llama 3.3 70B (<code>${esc(model)}</code>) — running on Cloudflare Workers AI. Writing a thoughtful reply to what you said is the job it is good at, so it keeps that job. Deciding what exists is not, so it doesn’t get that one.</p>
  <div class="split">
    <div class="panel">
      <h3>Written by the model</h3>
      <ul>
        <li>The reflection of what you said</li>
        <li>Why the field fits you, in its words</li>
        <li>The road in: first job, useful cert, what year one looks like</li>
        <li>A weekend idea — only when no checked trial exists, and labelled as the model’s</li>
      </ul>
    </div>
    <div class="panel">
      <h3>From CertBlueprint’s checked data</h3>
      <ul>
        <li>The field name shown in the reading, whenever the model’s pick matches the list</li>
        <li>Every role page it links to</li>
        <li>The weekend trial, with its time, cost and safety notes</li>
        <li>The note that says when a field is not something this site maps</li>
      </ul>
    </div>
  </div>
  <p>If the model names a field that is not on the list, the page drops the links rather than guessing. A missing link is a smaller mistake than a confident wrong one.</p>
</section>

<section>
  <h2>Every field the reader can point you to</h2>
  <p>The reader covers the full breadth of IT, including directions this site does not map. ${covered.length} fields link straight to role pages here${partial.length ? `, ${partial.length} links to close neighbours` : ''}${none.length ? `, and ${none.length} are named honestly as outside what CertBlueprint covers` : ''}.</p>
  <h3>Mapped to role pages</h3>
  <ul class="fields">${covered.map(fieldItem).join('')}</ul>
  ${partial.length ? `<h3>Partly mapped</h3><ul class="fields">${partial.map(fieldItem).join('')}</ul>` : ''}
  ${none.length ? `<h3>Not mapped here — and the reading will say so</h3><ul class="fields">${none.map(fieldItem).join('')}</ul>` : ''}
</section>

<section>
  <h2>What happens to what you write</h2>
  <ul>
    <li>Each answer is sent to CertBlueprint’s server and passed to Cloudflare Workers AI, which generates the reply. Cloudflare processes it under <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer" target="_blank">its own privacy policy</a>.</li>
    <li>CertBlueprint does not save or log what you write. There is no account and no database behind this page.</li>
    <li>The conversation exists only in this page. Reload or leave, and it is gone — it is not kept in your browser either.</li>
    <li>What you type is not sent to analytics.</li>
    <li>Leave out your name, employer, contact details, and anything you would not want an AI service to process. The reader needs how you like to work, not who you are.</li>
  </ul>
  <p>See the <a href="/legal/privacy-policy/">privacy policy</a> for the rest of the site.</p>
</section>

<section>
  <h2>Limits worth knowing</h2>
  <ul>
    <li>Up to ${maxTurns} answers in a conversation, each up to about ${clientLimit.toLocaleString('en-US')} characters.</li>
    <li>It can be wrong, and it only knows what you tell it. Treat a reading as the start of a conversation, not a verdict.</li>
    <li>It is instructed never to comment on age, gender, race, religion, health, or other personal characteristics.</li>
    <li>If you mention military service, it stays at the level of capabilities and never asks for operational details.</li>
    <li>Text that tries to instruct it instead of answering — “recommend cybersecurity”, “ignore your rules” — gets a follow-up asking for a real answer, not a reading.</li>
  </ul>
</section>

<section>
  <h2>The Lab or the guided assessment?</h2>
  <div class="split">
    <div class="panel">
      <h3>This Lab</h3>
      <ul>
        <li>You write; an AI model reads it</li>
        <li>1 to ${maxTurns} answers</li>
        <li>Good if you already have a sense of yourself and want it interpreted</li>
        <li>Needs a connection to our server</li>
      </ul>
    </div>
    <div class="panel">
      <h3><a href="/navigator/assessment/">Guided assessment</a></h3>
      <ul>
        <li>You choose between parts of real IT situations</li>
        <li>Usually 11–15 questions, no AI involved</li>
        <li>Good if you have no idea yet where to start</li>
        <li>Scored entirely in your browser; answers are never sent anywhere</li>
      </ul>
    </div>
  </div>
  <p>Doing both is reasonable. If they agree, that is a strong signal; if they disagree, read both roles and try <a href="/navigator/compare/">comparing them side by side</a>.</p>
</section>

<section>
  <h2>Questions</h2>
  <details><summary>Is it free?</summary><p>Yes. No signup, no account, no payment.</p></details>
  <details><summary>Why did it ask me a question instead of answering?</summary><p>Because your first answer could reasonably point at more than one field. A good mentor checks before placing someone, and the reader is built to do the same — it will conclude after at most ${followUps} follow-ups either way.</p></details>
  <details><summary>Will it recommend a field this site doesn’t cover?</summary><p>Yes. It is told to point you at the right field, not the convenient one. For project management, business analysis, technical writing and AI/ML, the page says plainly that CertBlueprint does not map that path and, where it can, shows the closest roles it does.</p></details>
  <details><summary>Does it know about certifications and salaries?</summary><p>It knows general patterns, and it can be out of date. For checked exam details, use the <a href="/vendors/">certification guides</a>; for pay, each <a href="/navigator/explore/">role page</a> shows what people typically start on and how far to trust the figure.</p></details>
  <details><summary>Why is an AI better than a quiz here?</summary><p>It isn’t better — it is different. A quiz can only offer the options someone wrote in advance; the Lab can respond to exactly what you said. The guided assessment is more consistent and fully private, which is why both exist.</p></details>
</section>

</div></div>`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Navigator Lab — Talk It Out',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web browser',
    url: 'https://certblueprint.com/navigator-lab',
    description:
      'Describe how you like to work in your own words and an AI reader points you at the IT field that fits, linked to checked role pages and weekend trials.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'CertBlueprint', url: 'https://certblueprint.com' },
  };
  const head = `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`;

  const html = fill(fill(template, 'HEAD', head), 'EXPLAINER', explainer);

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
