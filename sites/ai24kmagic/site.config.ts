import { defineSite } from '@shipwords/core/site';

// All config for this site. Prices are in the smallest currency unit (cents). Do not change id after launch.
// One dance video is 10 credits, same price for 1 to 4 people. Pack prices are a starting point copied from the
// Tiny Desk cost shape (about $3 of Kling plus repair headroom). Re-price after a real Yir run of the licensed clip.
// Sign in, then buy, then generate. No guest trial and no sign-up bonus: a video is too expensive to give away.
export default defineSite({
  id: 'ai24kmagic',
  name: '24K Magic AI',
  url: 'https://24kmagicai.com',
  locales: ['en'],
  defaultLocale: 'en',
  products: [
    {
      id: 'video_1',
      kind: 'credits',
      name: '1 video',
      price: { amount: 998, currency: 'usd' },
      credits: 10,
      expiresDays: null,
    },
    {
      id: 'video_3',
      kind: 'credits',
      name: '3 videos',
      price: { amount: 2499, currency: 'usd' },
      credits: 30,
      expiresDays: null,
    },
    {
      id: 'video_10',
      kind: 'credits',
      name: '10 videos',
      price: { amount: 5999, currency: 'usd' },
      credits: 100,
      expiresDays: null,
    },
  ],
  signup: { bonusCredits: 0, bonusExpiresDays: null, bonusPerIpDaily: 0, bonusSiteDaily: 0 },
  guest: { dailyPerDevice: 0, dailyPerIp: 0, dailySiteBudget: 0, minRecaptchaScore: 0.5 },
  billing: { provider: 'stripe', automaticTax: false },
  analytics: {},
});
