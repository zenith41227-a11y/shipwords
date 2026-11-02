import { pageHead } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { Faq, type FaqItem, faqJsonLd, GuidePage } from '~/site/guide';
import site from '../../site.config';

const PATH = '/cruise-deck-dance-template';

const faq = (): FaqItem[] => [
  { q: m.guides_template_faq1_q(), a: m.guides_template_faq1_a() },
  { q: m.guides_template_faq2_q(), a: m.guides_template_faq2_a() },
];

export const Route = createFileRoute('/cruise-deck-dance-template')({
  head: () =>
    pageHead(site, {
      title: m.guides_template_meta_title(),
      description: m.guides_template_meta_description(),
      path: PATH,
      jsonLd: [faqJsonLd(faq())],
    }),
  component: TemplatePage,
});

function TemplatePage() {
  return (
    <GuidePage
      path={PATH}
      title={m.guides_template_title()}
      updated={m.guides_template_updated()}
      intro={<p>{m.guides_template_intro()}</p>}
    >
      <h2>{m.guides_template_shots_heading()}</h2>
      <ol>
        <li>{m.guides_template_shot1()}</li>
        <li>{m.guides_template_shot2()}</li>
        <li>{m.guides_template_shot3()}</li>
      </ol>
      <h2>{m.guides_template_slots_heading()}</h2>
      <p>{m.guides_template_slots_body()}</p>
      <h2>{m.guides_template_assets_heading()}</h2>
      <p>{m.guides_template_assets_body()}</p>
      <Faq title={m.guides_template_faq_heading()} items={faq()} />
    </GuidePage>
  );
}
