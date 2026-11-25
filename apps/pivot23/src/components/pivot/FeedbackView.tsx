import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { ENGINE_VERSION } from "@/lib/pivot/config";
import {
  FEEDBACK_STARS,
  REVIEW_MAX,
  applyFeedbackDraft,
  browserFeedbackStore,
  canEditStars,
  createFeedbackAdapter,
  latestCareerSummary,
  readFeedback,
  type FeedbackStars,
} from "@/lib/pivot/feedback";
import { FLAGS } from "@/lib/pivot/flags";
import { NUMBER_LOCALE, t, tf, useLang } from "@/lib/pivot/i18n";
import type { ArchiveCareer } from "@/lib/pivot/types";

function submittedAt() {
  return Date.now();
}

export function FeedbackView({
  archive,
  onBack,
}: {
  archive: ArchiveCareer[];
  onBack: () => void;
}) {
  const lang = useLang();
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const store = browserFeedbackStore();
  const stored = store ? readFeedback(store) : null;
  const [stars, setStars] = useState<FeedbackStars | null>(stored?.stars ?? null);
  const [review, setReview] = useState(stored?.review ?? "");
  const [trap, setTrap] = useState("");
  const [notice, setNotice] = useState<"saved" | "locked" | "needStars" | "tooLong" | "miss" | null>(
    stored ? "saved" : null,
  );
  const [now] = useState(() => Date.now());
  const gate = canEditStars(stored, now);
  const starsLocked = !gate.ok;
  const summary = latestCareerSummary(archive);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!store) {
      setNotice("miss");
      return;
    }
    if (!stars) {
      setNotice("needStars");
      return;
    }
    const result = applyFeedbackDraft(store, {
      stars,
      review,
      lang,
      engineVersion: stored?.engineVersion || ENGINE_VERSION,
      careerSummary: summary,
      trap,
    }, submittedAt());
    if (!result.ok) {
      setNotice(result.reason === "locked" ? "locked" : result.reason === "quota" ? "miss" : review.trim().length > REVIEW_MAX ? "tooLong" : "needStars");
      return;
    }
    if (result.skipped === "spam") {
      setNotice("saved");
      return;
    }
    const adapter = createFeedbackAdapter({ store, submitEnabled: FLAGS.feedbackSubmit });
    const sent = await adapter.submit(result.record);
    setNotice(sent.ok ? "saved" : "miss");
  }

  const lockedDate = !gate.ok
    ? new Date(gate.nextAt).toLocaleDateString(NUMBER_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <section className="fade-in feedback-page" data-feedback="page">
      <button type="button" className="back-link" onClick={onBack}>
        <ChevronLeft className="size-4" aria-hidden="true" /> {t("home", lang)}
      </button>
      <h2 className="page-title" id={titleId} ref={titleRef} tabIndex={-1}>
        {t("feedback", lang)}
      </h2>
      <p className="lede">{t("feedbackLede", lang)}</p>
      <form className="feedback-form" onSubmit={onSubmit} noValidate>
        <div
          className="feedback-honeypot"
          aria-hidden="true"
        >
          <label>
            company
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
            />
          </label>
        </div>
        <p className="group-label" id="feedback-stars-label">
          {t("feedbackStars", lang)}
        </p>
        <div className="feedback-stars" role="radiogroup" aria-labelledby="feedback-stars-label">
          {FEEDBACK_STARS.map((n) => {
            const on = stars !== null && n <= stars;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                className={`feedback-star${on ? " on" : ""}`}
                aria-checked={stars === n}
                aria-label={tf("feedbackStarN", { n }, lang)}
                data-star={n}
                disabled={starsLocked && n !== stored?.stars}
                onClick={() => {
                  if (starsLocked) return;
                  setStars(n);
                  if (notice === "needStars" || notice === "saved") setNotice(null);
                }}
              >
                <span aria-hidden="true">{on ? "★" : "☆"}</span>
              </button>
            );
          })}
        </div>
        <p className="feedback-note">{t("feedbackStarsHint", lang)}</p>
        {starsLocked ? <p className="feedback-note" role="status">{tf("feedbackStarsLocked", { date: lockedDate }, lang)}</p> : null}
        <label className="group-label" htmlFor="feedback-review">{t("feedbackReview", lang)}</label>
        <textarea
          id="feedback-review"
          className="text-input feedback-review"
          rows={6}
          maxLength={REVIEW_MAX}
          value={review}
          placeholder={t("feedbackReviewPlaceholder", lang)}
          onChange={(e) => setReview(e.target.value)}
        />
        <p className="feedback-note">{t("feedbackReviewHint", lang)}</p>
        <p className="feedback-note" aria-live="polite">{tf("feedbackChars", { n: review.length, max: REVIEW_MAX }, lang)}</p>
        {notice === "needStars" ? <p className="confirm-error" role="alert">{t("feedbackNeedStars", lang)}</p> : null}
        {notice === "tooLong" ? <p className="confirm-error" role="alert">{t("feedbackTooLong", lang)}</p> : null}
        {notice === "miss" ? <p className="confirm-error" role="alert">{t("feedbackSaveMiss", lang)}</p> : null}
        {notice === "saved" ? <p className="feedback-note" role="status" data-feedback="saved">{t("feedbackSavedLocal", lang)}</p> : null}
        <p className="feedback-note">{t("feedbackPrivacyLocal", lang)}</p>
        <button type="submit" className="primary-btn mt-4" data-feedback="submit">
          {t("feedbackSubmit", lang)}
        </button>
      </form>
    </section>
  );
}
