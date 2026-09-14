import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Draft, Lead, makeDraft, sampleLeads } from "./model";
import { LIVE } from "./deployment";
const KEY = LIVE ? "hanson-website-live-v1" : "hanson-website-preview-v1";
interface Data {
  draft: Draft;
  step: number;
  leads: Lead[];
}
function initial(): Data {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (
      s &&
      Array.isArray(s.leads) &&
      typeof s.draft?.id === "string" &&
      typeof s.draft?.street === "string"
    )
      return {
        draft: { ...makeDraft(), ...s.draft, ...(LIVE && s.draft.intent === "assessment" && !s.draft.partnerConsent ? { consent: false, partnerConsent: false } : {}) },
        step: Math.min(4, Math.max(0, Number(s.step) || 0)),
        leads: s.leads.filter((l: Lead) => l?.draft && l.id),
      };
  } catch {}
  return { draft: makeDraft(), step: 0, leads: LIVE ? [] : sampleLeads() };
}
export type Photo = { file: File; url: string };
interface Store extends Data {
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  saveLead: (lead: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  newDraft: () => void;
  photos: Record<string, Photo>;
  setPhoto: (id: string, key: string, file?: File) => void;
  storageWarning: boolean;
  clearPreview: () => void;
}
const Context = createContext<Store | null>(null);
export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [boot] = useState(initial);
  const [draft, setDraft] = useState(boot.draft);
  const [step, setStep] = useState(boot.step);
  const [leads, setLeads] = useState(boot.leads);
  const [photos, setPhotos] = useState<Record<string, Photo>>({});
  const [storageWarning, setWarning] = useState(false);
  const photoRef = useRef(photos);
  useEffect(() => {
    photoRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      Object.values(photoRef.current).forEach((p) =>
        URL.revokeObjectURL(p.url),
      );
    },
    [],
  );
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ draft, step, leads }));
      setWarning(false);
    } catch {
      setWarning(true);
    }
  }, [draft, step, leads]);
  const saveLead = (l: Lead) =>
    setLeads((old) => [l, ...old.filter((x) => x.id !== l.id)]);
  const updateLead = (id: string, patch: Partial<Lead>) =>
    setLeads((old) => old.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const newDraft = () => {
    setDraft(makeDraft());
    setStep(0);
  };
  const setPhoto = (id: string, key: string, file?: File) => {
    const k = `${id}:${key}`;
    if (photos[k]) URL.revokeObjectURL(photos[k].url);
    const photo = file ? { file, url: URL.createObjectURL(file) } : undefined;
    setPhotos((old) => {
      const next = { ...old };
      if (photo) next[k] = photo;
      else delete next[k];
      return next;
    });
    setLeads((old) =>
      old.map((l) => {
        if (l.id !== id) return l;
        const names = { ...l.photoNames };
        if (file) names[key] = file.name;
        else delete names[key];
        return { ...l, photoNames: names };
      }),
    );
  };
  const clearPreview = () => {
    Object.values(photos).forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos({});
    setLeads(LIVE ? [] : sampleLeads());
    newDraft();
  };
  return (
    <Context.Provider
      value={{
        draft,
        setDraft,
        step,
        setStep,
        leads,
        saveLead,
        updateLead,
        newDraft,
        photos,
        setPhoto,
        storageWarning,
        clearPreview,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePreview() {
  const c = useContext(Context);
  if (!c) throw Error("PreviewProvider is required");
  return c;
}
