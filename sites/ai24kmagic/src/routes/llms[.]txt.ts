import { llmsTxt } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { GUIDES } from '~/site/guide';
import site from '../../site.config';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () =>
        llmsTxt(
          site,
          '24K Magic AI Dance turns one to four photos into a vertical cruise-deck dance video in a gold, funk mood. It is the same kind of photo-to-performance swap as a Tiny Desk video, on a night yacht deck instead of a studio band. One video is $9.98 for 1 to 4 people; packs of 3 are $24.99 and 10 are $59.99. Sign in, then buy credits. There is no free render. Output is about 12 seconds, 720p, 9:16, with a licensed track plus a silent copy. The official Bruno Mars recording is not included. Not affiliated with Bruno Mars or the label.',
          [
            {
              title: '24K Magic AI Dance',
              path: '/',
              description: 'Upload photos, cast the deck, and download the dance. Pricing and FAQ.',
            },
            ...GUIDES.map((guide) => ({
              title: guide.title(),
              path: guide.path,
              description: guide.description(),
            })),
            {
              title: 'Refund policy',
              path: '/refunds',
              description: 'Credits return when a video cannot be made.',
            },
            {
              title: 'Privacy policy',
              path: '/privacy',
              description: 'What the site stores about an account and an upload.',
            },
            {
              title: 'DMCA and takedown',
              path: '/dmca',
              description: 'How to ask for a video or other material to be removed.',
            },
          ],
        ),
    },
  },
});
