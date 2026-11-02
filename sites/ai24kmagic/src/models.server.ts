import { serverModels } from '@shipwords/jobs/models';
import catalog from '../site.models';

// Server only: never import this file from pages or components. site.models.ts holds the public part of each entry.
//
// One effect: a vertical cruise-deck dance, swapped in one Kling edit pass, then composed with a licensed track.
// The reference clip and the track are NOT in the repo. Do not commit Bruno Mars' recording or an unlicensed copy
// of the "24K Magic" video. Zenith supplies both under license, at these R2 keys:
//   assets/deck/dance.mp4   720×1280, 24 fps, 12 seconds, the dance to edit
//   assets/deck/track.m4a   the track composed back in (12 seconds from the start)
// WHO below names each dancer by place and clothes. Those words must match the licensed clip or the edit
// will replace the wrong person. Update them when the clip is locked.
//
// MEASURED stays false until a person measures the real clip. With it false there is no face check and no
// shot-by-shot repair, and compose stretches the whole edit to 12 seconds. Flip it only after replacing the
// placeholder face points and confirming the clip has hard cuts within 0.5 s of 4 s and 8 s. Wrong points
// will treat a good swap as a miss, or deliver a missed face. Do not take money before that measurement
// and a few real Yir runs (cost, time, likeness). The $5.60 cap assumes the Tiny Desk Kling quote
// ($3.06 at 720p) plus prep and up to five repair passes. It is not a measured cost for this clip.

/** Turn on check, repair, and shot cuts only after the licensed clip has been measured. */
const MEASURED = false;

/** Who is in the licensed clip, in slot order. This is the @image_1… order. Update to match that clip. */
const WHO = {
  lead: 'the lead dancer in the center wearing a gold jacket',
  port: 'the dancer on the left side of the deck in a white shirt',
  starboard: 'the dancer on the right side of the deck in a black jacket',
  rail: 'the dancer standing at the railing in a sequined top',
} as const;
type Seat = keyof typeof WHO;

/** Position-only names for a repair pass, after the original clothes may already be gone. */
const SPOT: Record<Seat, string> = {
  lead: 'the lead dancer in the center',
  port: 'the dancer on the left',
  starboard: 'the dancer on the right',
  rail: 'the dancer at the railing',
};

const CLIP = 'assets/deck/dance.mp4';

function editPrompt(images: Readonly<Record<string, string>>) {
  const filled = (Object.keys(WHO) as Seat[]).filter((seat) => images[seat]);
  const swaps = filled.map(
    (seat) =>
      `Replace ${WHO[seat]} with the person in ${images[seat]!.replace(/^@image(\d+)$/, '@image_$1')}.`,
  );
  const others =
    filled.length < Object.keys(WHO).length ? ' Everyone else stays exactly as in @video_1.' : '';
  return [
    'Edit @video_1.',
    ...swaps,
    'Each replaced dancer keeps the original position, steps, arm paths, head direction, and timing, frame by frame, and wears the clothes from their own photo.',
    'Do not add a dancer who was not in @video_1, and do not move anyone into a shot they were not in.',
    `Keep the cruise deck, the railing, the night sea, the gold lights, the camera cuts, the camera movement, and the video duration unchanged.${others}`,
    'Keep the audio exactly identical to the original video. Do not add any new sounds.',
  ].join(' ');
}

function repairPrompt(slots: readonly string[]) {
  const keep =
    'face, hair and clothes. Keep the position, steps, gestures, head direction and timing. Do not change anyone else.';
  if (slots.length === 1) return `Replace ${SPOT[slots[0] as Seat]} with the person in the image: ${keep}`;
  const images = slots.map((slot, i) => `image ${i + 1} is ${SPOT[slot as Seat]}`).join('; ');
  return `In order, ${images}. Replace each of these dancers with the person in their image: ${keep}`;
}

/** Three-view strip so the edit has a front and both profiles. If prep fails, the original photo is used. */
const PREP = [
  'Make one horizontal reference strip of the main person in this photo, split into three equal panels of that same person: left panel in left profile, middle panel facing the camera, right panel in right profile.',
  'Keep the same individual in every panel: the same face, skin tone, age, hairstyle, and facial hair. Head and shoulders, the face large and in focus. The face stays fully visible in each panel, with no boxes, masks, or added coverings.',
  'Only this one subject. Remove other people, phone bars, captions, stickers, and watermarks. Keep their clothes, plain, with no logos or readable letters. A plain light wall, soft daylight, no text and no borders.',
].join(' ');

// Placeholder geometry for a 12 s clip with cuts at 4 s and 8 s. Not measured. Do not set MEASURED until these match the file.
const CUTS = [4, 8] as const;
const CHECK = {
  original: CLIP,
  faces: {
    lead: [0.5, 0.36, 9],
    port: [0.28, 0.46, 1],
    starboard: [0.72, 0.46, 1],
    rail: [0.5, 0.4, 5],
  },
  maxSimilarity: 0.45,
} as const;
const REPAIR = {
  upstreamModel: 'pruna/p-video-replace',
  prompt: repairPrompt,
  parameters: { resolution: '720p' },
  maxCost: '0.40',
  rounds: 5,
  onMiss: 'deliver' as const,
  // Wide shot is three people (the replace model takes at most three). Rail is its own shot. Lead returns in a close-up.
  shots: [['lead', 'port', 'starboard'], ['rail'], ['lead']],
  likeness: { lead: 0.5 },
};

export default serverModels(catalog, {
  'deck-dance': {
    upstream: 'yir',
    upstreamModel: 'klingai/kling-4.0',
    // Segment 3.40 + five repair passes at 0.40 + prep hedge (4 photos × 0.02 × 2) = 5.56, under this cap.
    // The cap stays in the sum even while MEASURED is false, so turning repair on does not require a new cap.
    maxCost: '5.60',
    timeoutMinutes: 45,
    effect: {
      slots: catalog
        .find((model) => model.id === 'deck-dance')!
        .effect!.slots.map((slot) => ({ ...slot, prep: PREP })),
      prep: {
        upstreamModel: 'openai/gpt-image-2.5-sunburst',
        parameters: { resolution: '1K', aspect_ratio: '16:9' },
        maxCost: '0.02',
      },
      segments: [
        {
          id: 'full',
          referenceVideo: CLIP,
          slots: ['lead', 'port', 'starboard', 'rail'],
          prompt: editPrompt,
          parameters: { duration: 12, resolution: '720p', aspect_ratio: 'auto' },
          maxCost: '3.40',
          target: 12,
          base: CLIP,
          ...(MEASURED ? { cuts: CUTS, check: CHECK, repair: REPAIR } : {}),
        },
      ],
      compose: {
        audio: 'assets/deck/track.m4a',
        audioStart: 0,
        audioDuration: 12,
        width: 720,
        height: 1280,
        fps: 24,
      },
    },
  },
});
