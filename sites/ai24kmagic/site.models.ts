import { definePublicModels } from '@shipwords/jobs/models';

// The tool page imports this file, so it ends up in the browser bundle: keep only what the page shows.
// Prompts, the upstream model, the reference clip and checks live in src/models.server.ts.
export default definePublicModels([
  {
    id: 'deck-dance',
    name: 'Cruise deck dance',
    kind: 'video',
    credits: 10,
    guest: false,
    allowedParameters: [],
    maxReferences: 0,
    effect: {
      slots: [
        { id: 'lead', label: 'Lead', required: false },
        { id: 'port', label: 'Port', required: false },
        { id: 'starboard', label: 'Starboard', required: false },
        { id: 'rail', label: 'Rail', required: false },
      ],
    },
  },
]);
