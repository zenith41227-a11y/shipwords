import { pageHead } from '@shipwords/core/seo';
import { useGeneration } from '@shipwords/jobs/react';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { Faq, type FaqItem } from '~/site/guide';
import { formatPrice, Plans } from '~/site/pricing';
import { DeckTool, ReturnNotice } from '~/site/tool';
import site from '../../site.config';

const PRICE = formatPrice(site.products[0]);
const root = getRouteApi('__root__');

const STEPS = [
  { title: m.home_step1_title, text: m.home_step1_text },
  { title: m.home_step2_title, text: m.home_step2_text },
  { title: m.home_step3_title, text: m.home_step3_text },
];

const FAQ: { q: () => string; a: () => string }[] = [
  { q: m.home_faq_what_q, a: m.home_faq_what_a },
  { q: m.home_faq_people_q, a: m.home_faq_people_a },
  {
    q: m.home_faq_cost_q,
    a: () =>
      m.home_faq_cost_a({
        plans: site.products.map((product) => `${product.name} ${formatPrice(product)}`).join(', '),
      }),
  },
  { q: m.home_faq_free_q, a: m.home_faq_free_a },
  { q: m.home_faq_time_q, a: m.home_faq_time_a },
  { q: m.home_faq_song_q, a: m.home_faq_song_a },
  { q: m.home_faq_photo_q, a: m.home_faq_photo_a },
  { q: m.home_faq_rights_q, a: m.home_faq_rights_a },
  { q: m.home_faq_fail_q, a: m.home_faq_fail_a },
];

export const Route = createFileRoute('/')({
  head: () =>
    pageHead(site, {
      title: m.home_meta_title(),
      description: m.home_meta_description({ price: PRICE }),
      path: '/',
      jsonLd: [
        {
          '@type': 'WebApplication',
          name: site.name,
          url: site.url,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Web',
          offers: site.products.map((product) => ({
            '@type': 'Offer',
            name: product.name,
            price: (product.price.amount / 100).toFixed(2),
            priceCurrency: product.price.currency.toUpperCase(),
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQ.map((item) => ({
            '@type': 'Question',
            name: item.q(),
            acceptedAnswer: { '@type': 'Answer', text: item.a() },
          })),
        },
      ],
    }),
  component: HomePage,
});

function HomePage() {
  const config = root.useLoaderData();
  const generation = useGeneration({ recaptchaSiteKey: config.recaptchaSiteKey });
  const faq: FaqItem[] = FAQ.map((item) => ({ q: item.q(), a: item.a() }));
  return (
    <>
      <ReturnNotice jobs={generation.jobs} />
      <section className="hero">
        <p className="kicker">{m.home_kicker()}</p>
        <h1>{m.home_title()}</h1>
        <p className="lead">{m.home_lead()}</p>
        <img className="deck" src="/deck.svg" alt="" width={720} height={420} />
        <p className="muted standin">{m.home_standin()}</p>
        <DeckTool generation={generation} />
      </section>

      <section className="band" id="how">
        <h2>{m.home_how_heading()}</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.title.name}>
              <h3>{step.title()}</h3>
              <p>{step.text()}</p>
            </li>
          ))}
        </ol>
        <p>
          <Link to="/how-to-make-a-24k-magic-ai-dance-video">{m.common_nav_how()}</Link>
        </p>
      </section>

      <section className="band">
        <h2>{m.home_diff_heading()}</h2>
        <p>{m.home_diff_body()}</p>
      </section>

      <section className="band" id="pricing">
        <h2>{m.home_pricing_heading()}</h2>
        <p className="muted">{m.home_pricing_note()}</p>
        <Plans />
      </section>

      <section className="band" id="faq">
        <Faq title={m.home_faq_heading()} items={faq} />
      </section>
    </>
  );
}
