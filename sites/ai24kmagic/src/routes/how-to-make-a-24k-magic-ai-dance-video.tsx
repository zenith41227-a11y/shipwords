import { pageHead } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { Faq, type FaqItem, faqJsonLd, GuidePage } from '~/site/guide';
import { formatPrice } from '~/site/pricing';
import site from '../../site.config';

const PATH = '/how-to-make-a-24k-magic-ai-dance-video';

const steps = () => [
  { name: m.guides_howto_step1_name(), text: m.guides_howto_step1_text() },
  { name: m.guides_howto_step2_name(), text: m.guides_howto_step2_text() },
  { name: m.guides_howto_step3_name(), text: m.guides_howto_step3_text() },
  { name: m.guides_howto_step4_name(), text: m.guides_howto_step4_text() },
];

const faq = (): FaqItem[] => [
  { q: m.guides_howto_faq1_q(), a: m.guides_howto_faq1_a() },
  { q: m.guides_howto_faq2_q(), a: m.guides_howto_faq2_a() },
  { q: m.guides_howto_faq3_q(), a: m.guides_howto_faq3_a() },
  { q: m.guides_howto_faq4_q(), a: m.guides_howto_faq4_a() },
];

export const Route = createFileRoute('/how-to-make-a-24k-magic-ai-dance-video')({
  head: () =>
    pageHead(site, {
      title: m.guides_howto_meta_title(),
      description: m.guides_howto_meta_description(),
      path: PATH,
      jsonLd: [
        {
          '@type': 'HowTo',
          name: m.guides_howto_title(),
          totalTime: 'PT15M',
          estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: site.products[0].price.currency.toUpperCase(),
            value: (site.products[0].price.amount / 100).toFixed(2),
          },
          step: steps().map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
          })),
        },
        faqJsonLd(faq()),
      ],
    }),
  component: HowToPage,
});

function HowToPage() {
  return (
    <GuidePage
      path={PATH}
      title={m.guides_howto_title()}
      updated={m.guides_howto_updated()}
      intro={<p>{m.guides_howto_intro()}</p>}
    >
      <h2>{m.guides_howto_need_heading()}</h2>
      <ul>
        <li>{m.guides_howto_need_photos()}</li>
        <li>{m.guides_howto_need_people()}</li>
        <li>
          {m.guides_howto_need_price({ price: formatPrice(site.products[0]) })}{' '}
          <a href="/#pricing">{m.guides_howto_need_price_link()}</a>
          {m.guides_howto_need_price_after()}
        </li>
      </ul>
      {steps().map((step, index) => (
        <section key={step.name}>
          <h2>{m.guides_howto_step_heading({ n: index + 1, name: step.name })}</h2>
          <p>{step.text}</p>
        </section>
      ))}
      <h2>{m.guides_howto_rights_heading()}</h2>
      <p>{m.guides_howto_rights_body()}</p>
      <Faq title={m.guides_howto_faq_heading()} items={faq()} />
    </GuidePage>
  );
}
