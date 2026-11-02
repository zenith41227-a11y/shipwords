import { ApiError } from '@shipwords/core/react/account';
import {
  acceptsUpload,
  type PublicJob,
  UPLOAD_ACCEPT,
  uploadReference,
  type useGeneration,
} from '@shipwords/jobs/react';
import { getRouteApi } from '@tanstack/react-router';
import { type DragEvent, type FormEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { authClient } from '~/lib/auth';
import { track } from '~/lib/track';
import { m } from '~/paraglide/messages.js';
import { formatPrice, openPricing, PricingLink } from '~/site/pricing';
import { openSignIn } from '~/site/sign-in';
import site from '../../site.config';
import models from '../../site.models';

// Home-page generator: four dancer cards. At least one photo. Same price for 1–4 people.
// Sign in, then credits. No guest trial. Design: DESIGN.md.

const MODEL = models[0];
if (!MODEL.effect) throw new Error('deck-dance is missing its slots');
const SLOTS = MODEL.effect.slots;
const PRODUCT = site.products.find(
  (product) => product.kind === 'credits' && product.credits === MODEL.credits,
);
const PRICE = PRODUCT ? formatPrice(PRODUCT) : '';

const LABEL: Record<string, () => string> = {
  lead: m.common_slot_lead,
  port: m.common_slot_port,
  starboard: m.common_slot_starboard,
  rail: m.common_slot_rail,
};

const PRESETS = [
  { id: 'me', label: m.common_preset_me, slots: ['lead'] },
  { id: 'line', label: m.common_preset_line, slots: ['lead', 'port', 'starboard', 'rail'] },
];

const PHOTOS_KEY = 'deck:photos';
const CONSENT_KEY = 'deck:consent';

function store(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode can refuse storage; the page still works for this visit.
  }
}

function load<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

const root = getRouteApi('__root__');

export function DeckTool({ generation }: { generation: ReturnType<typeof useGeneration> }) {
  const config = root.useLoaderData();
  const session = authClient(config.googleClientId).useSession();
  const { jobs, generate, cancel, submitting, error } = generation;
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [needConsent, setNeedConsent] = useState(false);
  const [needPhoto, setNeedPhoto] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [confirmAnother, setConfirmAnother] = useState(false);
  const [fileTarget, setFileTarget] = useState<string | null>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const started = useRef<HTMLDialogElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const rendering = jobs.some((job) => job.status === 'queued' || job.status === 'submitted');

  useEffect(() => {
    const saved = load<Record<string, string>>(PHOTOS_KEY);
    if (saved) setPhotos(saved);
    if (load<boolean>(CONSENT_KEY)) setConsent(true);
    const url = new URL(window.location.href);
    if (url.searchParams.has('resume')) {
      setResumed(Boolean(saved && Object.keys(saved).length));
      url.searchParams.delete('resume');
      window.history.replaceState(window.history.state, '', url);
    }
  }, []);

  useEffect(() => {
    if (!rendering) setConfirmAnother(false);
  }, [rendering]);

  useEffect(() => {
    if (!error) return;
    track('generate_failed', { code: error.code ?? 'unknown' });
    if (error.code === 'insufficient_credits') openPricing('insufficient_credits');
  }, [error]);

  const statuses = useRef(new Map<string, PublicJob['status']>());
  useEffect(() => {
    for (const job of jobs) {
      const before = statuses.current.get(job.id);
      statuses.current.set(job.id, job.status);
      if (before !== 'queued' && before !== 'submitted') continue;
      const seconds = job.finishedAt ? Math.round((job.finishedAt - job.createdAt) / 1000) : 0;
      if (job.status === 'succeeded') track('video_ready', { seconds });
      else if (job.status === 'failed' || job.status === 'canceled')
        track('video_failed', { status: job.status });
    }
  }, [jobs]);

  function changePhotos(update: (current: Record<string, string>) => Record<string, string>) {
    setPhotos((current) => {
      const next = update(current);
      store(PHOTOS_KEY, next);
      return next;
    });
  }

  const filled = SLOTS.filter((slot) => photos[slot.id]).map((slot) => slot.id);

  async function onPick(slotId: string, file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setNeedPhoto(false);
    setUploading(slotId);
    try {
      const path = await uploadReference(file);
      changePhotos((current) => ({ ...current, [slotId]: path }));
      track('photo_added', { slot: slotId });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setUploadError(
        code === 'image_too_small'
          ? m.common_tool_photo_too_small()
          : code === 'unsupported_type' || code === 'too_large' || code === 'invalid_image'
            ? m.common_tool_file_type()
            : m.common_tool_upload_failed(),
      );
    } finally {
      setUploading(null);
    }
  }

  function clearSlot(slotId: string) {
    changePhotos((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
  }

  function onFileOver(slotId: string, event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    setFileTarget(uploading ? null : slotId);
  }

  function onFileDrop(slotId: string, event: DragEvent<HTMLElement>) {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    setFileTarget(null);
    if (uploading) return;
    const file = [...event.dataTransfer.files].find(acceptsUpload);
    if (file) void onPick(slotId, file);
    else setUploadError(m.common_tool_file_type());
  }

  async function start() {
    const current = photosRef.current;
    const slots = Object.fromEntries(
      SLOTS.filter((slot) => current[slot.id]).map((slot) => [slot.id, current[slot.id]!]),
    );
    const job = await generate({ modelId: MODEL.id, slots });
    if (!job) return;
    track('generate_started', { faces: Object.keys(slots).length, another: rendering });
    started.current?.showModal();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (filled.length === 0) {
      setNeedPhoto(true);
      inputs.current.get('lead')?.click();
      track('generate_click', { faces: 0, blocked: 'no_photo' });
      return;
    }
    if (!consent) {
      setNeedConsent(true);
      track('generate_click', { faces: filled.length, blocked: 'no_consent' });
      return;
    }
    if (rendering && !confirmAnother) {
      setConfirmAnother(true);
      track('generate_click', { faces: filled.length, blocked: 'confirm_another' });
      return;
    }
    setConfirmAnother(false);
    if (!session.data) {
      track('generate_click', { faces: filled.length, blocked: 'sign_in' });
      openSignIn(() => void start(), 'generate');
      return;
    }
    track('generate_click', { faces: filled.length, blocked: 'none' });
    await start();
  }

  return (
    <form className="tool" id="tool" onSubmit={onSubmit}>
      <div className="presets">
        {PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className="preset"
            onClick={() => {
              const empty = preset.slots.find((id) => !photos[id]);
              if (empty) inputs.current.get(empty)?.click();
            }}
          >
            {preset.label()}
          </button>
        ))}
      </div>
      <fieldset className="lineup">
        <legend className="sr-only">{m.common_tool_legend()}</legend>
        {SLOTS.map((slot) => {
          const photo = photos[slot.id];
          const name = LABEL[slot.id]?.() ?? slot.label;
          return (
            <div
              key={slot.id}
              className={['dancer', photo && 'is-filled', fileTarget === slot.id && 'is-drop']
                .filter(Boolean)
                .join(' ')}
            >
              <input
                ref={(node) => {
                  if (node) inputs.current.set(slot.id, node);
                  else inputs.current.delete(slot.id);
                }}
                id={`seat-${slot.id}`}
                className="sr-only"
                type="file"
                accept={UPLOAD_ACCEPT}
                onChange={(event) => {
                  void onPick(slot.id, event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <label
                htmlFor={`seat-${slot.id}`}
                onDragOver={(event) => onFileOver(slot.id, event)}
                onDragLeave={() => setFileTarget((current) => (current === slot.id ? null : current))}
                onDrop={(event) => onFileDrop(slot.id, event)}
              >
                {photo ? <img src={photo} alt="" /> : <span className="silhouette" aria-hidden="true" />}
                <span>{uploading === slot.id ? m.common_tool_uploading() : name}</span>
              </label>
              {photo && (
                <button type="button" className="clear" onClick={() => clearSlot(slot.id)}>
                  <span className="sr-only">{m.common_tool_remove({ seat: name })}</span>
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
          );
        })}
      </fieldset>
      <p className="status mono">{m.common_tool_status({ count: filled.length, price: PRICE })}</p>
      <label className={needConsent ? 'consent need' : 'consent'}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            setNeedConsent(false);
            store(CONSENT_KEY, event.target.checked);
          }}
        />
        {m.common_tool_consent()}
      </label>
      {needConsent && <p className="notice">{m.common_tool_need_consent()}</p>}
      {needPhoto && <p className="notice">{m.common_tool_need_photo()}</p>}
      <button type="submit" className="primary" disabled={submitting}>
        {submitting
          ? m.common_tool_starting()
          : confirmAnother
            ? m.common_tool_submit_another({ price: PRICE })
            : m.common_tool_submit({ price: PRICE })}
      </button>
      {confirmAnother && <p className="notice">{m.common_tool_confirm_another({ price: PRICE })}</p>}
      {resumed && !error && jobs.length === 0 && <p className="notice">{m.common_tool_resumed()}</p>}
      {uploadError && <p className="error">{uploadError}</p>}
      {error && <GenerationError code={error.code} message={error.message} />}
      <div className="results" id="my-videos">
        <h2>{m.common_my_videos()}</h2>
        {jobs.slice(0, 3).map((job) => (
          <JobCard
            key={job.id}
            job={job}
            email={session.data?.user.email}
            onCancel={() => void cancel(job.id)}
          />
        ))}
      </div>
      <StartedDialog dialog={started} email={session.data?.user.email} />
    </form>
  );
}

function GenerationError({ code, message }: { code: string | undefined; message: string }) {
  if (code === 'login_required') {
    return (
      <p className="notice">
        <button type="button" className="link-button" onClick={() => openSignIn(undefined, 'login_required')}>
          {m.common_tool_sign_in()}
        </button>
      </p>
    );
  }
  if (code === 'insufficient_credits') {
    return (
      <p className="notice">
        {m.common_tool_need_credits()}{' '}
        <PricingLink source="insufficient_credits">{m.common_tool_get_pack()}</PricingLink>
      </p>
    );
  }
  return <p className="error">{message}</p>;
}

const DOWNLOADS = [m.common_job_download_track, m.common_job_download_silent];
const VERSIONS = ['track', 'silent'];
const STAGES = [
  { after: 0, text: m.common_job_stage_cast },
  { after: 90, text: m.common_job_stage_dance },
  { after: 300, text: m.common_job_stage_mix },
];

function formatElapsed(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function JobCard({ job, email, onCancel }: { job: PublicJob; email?: string; onCancel: () => void }) {
  const active = job.status === 'queued' || job.status === 'submitted';
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  const elapsed = Math.max(0, (now - job.createdAt) / 1000);
  const stage = STAGES.filter((item) => elapsed >= item.after).at(-1) ?? STAGES[0];
  if (!stage) return null;

  return (
    <article className="job">
      {active && (
        <div className="job-pending">
          <p>
            <span className="live-dot" aria-hidden="true" />
            {stage.text()}
          </p>
          <p className="mono" suppressHydrationWarning>
            {formatElapsed(elapsed)} · {m.common_job_eta()}
          </p>
          <p className="muted">{email ? m.common_job_email({ email }) : m.common_job_email_generic()}</p>
        </div>
      )}
      {job.outputs[0] && (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: generated videos have no caption track. */}
          <video src={job.outputs[0].url} controls playsInline />
          <div className="job-downloads">
            {job.outputs.map((output, index) => (
              <a
                key={output.url}
                className="button"
                href={output.url}
                download={`24k-magic-ai-${job.id.slice(-6)}-${VERSIONS[index] ?? index}.mp4`}
              >
                {(DOWNLOADS[index] ?? m.common_job_download_track)()}
              </a>
            ))}
          </div>
          {job.outputs.length > 1 && <p className="muted job-tip">{m.common_job_silent_tip()}</p>}
        </>
      )}
      {job.status === 'failed' && <p className="error">{m.common_job_failed()}</p>}
      {job.status === 'queued' && (
        <button type="button" onClick={onCancel}>
          {m.common_job_cancel()}
        </button>
      )}
    </article>
  );
}

function StartedDialog({ dialog, email }: { dialog: RefObject<HTMLDialogElement | null>; email?: string }) {
  const close = () => dialog.current?.close();
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click is a mouse shortcut; Esc closes the dialog.
    <dialog
      ref={dialog}
      className="dialog started-dialog"
      aria-labelledby="started-title"
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <h2 id="started-title">{m.common_started_title()}</h2>
      <p>{m.common_started_body()}</p>
      <p>{email ? m.common_started_email({ email }) : m.common_started_email_generic()}</p>
      <button type="button" className="primary" onClick={close}>
        {m.common_started_ok()}
      </button>
    </dialog>
  );
}

const RECENT_MS = 24 * 3600_000;

export function ReturnNotice({ jobs }: { jobs: PublicJob[] }) {
  const rendering = jobs.some((job) => job.status === 'queued' || job.status === 'submitted');
  const latest = jobs[0];
  const ready =
    latest?.status === 'succeeded' &&
    latest.finishedAt !== null &&
    Date.now() - latest.finishedAt < RECENT_MS;
  if (!rendering && !ready) return null;
  return (
    <a className="notice return-notice" href="#my-videos">
      {rendering ? m.common_return_rendering() : m.common_return_ready()}
    </a>
  );
}
