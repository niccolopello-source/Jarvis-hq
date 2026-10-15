/**
 * Minimal IAB TCF v2.x reader over window.__tcfapi (provided by the Google certified CMP,
 * "Privacy & messaging"). Ads may load only when GDPR does not apply or Purpose 1
 * (store/access information on a device) has consent. We never request personalised ads.
 */
export interface TcData {
  eventStatus?: "tcloaded" | "cmpuishown" | "useractioncomplete";
  gdprApplies?: boolean;
  purpose?: { consents?: Record<string, boolean> };
  listenerId?: number;
}
type TcfApi = (cmd: string, version: number, cb: (data: TcData, ok: boolean) => void, arg?: unknown) => void;

export function consentAllowsAds(d: TcData | null | undefined): boolean {
  if (!d) return false;
  if (d.eventStatus !== "tcloaded" && d.eventStatus !== "useractioncomplete") return false;
  if (d.gdprApplies === false) return true;
  return d.purpose?.consents?.["1"] === true;
}

/** Calls onChange(true|false) whenever the consent decision changes. Returns an unsubscribe. */
export function watchConsent(onChange: (allowed: boolean) => void, w: Window = window): () => void {
  let listenerId: number | undefined;
  let stopped = false;
  let tries = 0;
  const attach = () => {
    if (stopped) return;
    const api = (w as unknown as { __tcfapi?: TcfApi }).__tcfapi;
    if (typeof api !== "function") {
      if (tries++ < 50) timer = w.setTimeout(attach, 200); // CMP stub may arrive late; give up after ~10s.
      return;
    }
    api("addEventListener", 2, (data, ok) => {
      if (!ok) return;
      listenerId = data.listenerId ?? listenerId;
      if (data.eventStatus === "cmpuishown") return;
      onChange(consentAllowsAds(data));
    });
  };
  let timer = w.setTimeout(attach, 0);
  return () => {
    stopped = true;
    w.clearTimeout(timer);
    const api = (w as unknown as { __tcfapi?: TcfApi }).__tcfapi;
    if (typeof api === "function" && listenerId !== undefined) api("removeEventListener", 2, () => {}, listenerId);
  };
}
