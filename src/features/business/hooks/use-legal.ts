import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { updateLegalStatus, updateLegalSurfaces, updateLegalTranslation } from '../api/business.mutations';
import {
  localesOf,
  nextSurfaces,
  toLegalTranslationUpdate,
  translationFor,
  type LegalDocument,
} from '../model/legal-document';
import { BUSINESS_LOCALES, type BusinessLocale, type PublicSurface } from '../model/locales';

type Feedback = {
  onStatusSaved: () => void;
  onStatusError: (error: unknown) => void;
  onSurfacesSaved: () => void;
  onSurfacesError: (error: unknown) => void;
  onTranslationSaved: () => void;
  onTranslationError: (error: unknown) => void;
};

/** Optional URL sync: `doc` search param for the selected legal code. */
type Selection = {
  codeFromUrl?: string;
  onCodeChange?: (code: string) => void;
};

type Draft = { key: string; title: string; content: string };

const draftKey = (code: string | null, locale: string) => `${code ?? ''}:${locale}`;

/**
 * Legal CMS: selected document and locale, status/surfaces/translation writes, and a discard dialog
 * when switching locale or document with a dirty translation.
 */
export function useLegal(documents: LegalDocument[], feedback: Feedback, selection?: Selection) {
  const queryClient = useQueryClient();
  const [selectedCode, setSelectedCode] = useState<string | null>(selection?.codeFromUrl ?? null);
  const [locale, setLocaleState] = useState<BusinessLocale>('es');
  const [draft, setDraft] = useState<Draft>({ key: ':', title: '', content: '' });
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<
    { kind: 'doc'; code: string } | { kind: 'locale'; locale: BusinessLocale } | null
  >(null);

  const preferred = selectedCode ?? selection?.codeFromUrl ?? null;
  const resolvedCode =
    preferred && documents.some((doc) => doc.code === preferred) ? preferred : (documents[0]?.code ?? null);
  const selected = documents.find((doc) => doc.code === resolvedCode) ?? null;
  const key = draftKey(resolvedCode, locale);
  const baseline = selected ? translationFor(selected, locale) : { title: '', content: '' };
  const showing = draft.key === key ? draft : { key, title: baseline.title, content: baseline.content };
  const isDirty = showing.title !== baseline.title || showing.content !== baseline.content;

  const applyDoc = (code: string) => {
    setSelectedCode(code);
    selection?.onCodeChange?.(code);
  };

  const codeFromUrl = selection?.codeFromUrl;
  const onCodeChange = selection?.onCodeChange;
  // Keep `?doc=` aligned with the resolved document once legal is open.
  useEffect(() => {
    if (resolvedCode && onCodeChange && resolvedCode !== codeFromUrl) {
      onCodeChange(resolvedCode);
    }
  }, [resolvedCode, codeFromUrl, onCodeChange]);

  const applyLocale = (next: BusinessLocale) => {
    setLocaleState(next);
  };

  const requestSwitch = (next: NonNullable<typeof pendingSwitch>) => {
    if (isDirty) {
      setPendingSwitch(next);
      setDiscardOpen(true);
      return;
    }
    if (next.kind === 'doc') applyDoc(next.code);
    else applyLocale(next.locale);
  };

  const status = useMutation({
    mutationFn: ({ code, isActive }: { code: string; isActive: boolean }) =>
      updateLegalStatus(queryClient, code, isActive),
    onSuccess: feedback.onStatusSaved,
    onError: feedback.onStatusError,
  });

  const surfaces = useMutation({
    mutationFn: ({ code, publicSurfaces }: { code: string; publicSurfaces: PublicSurface[] }) =>
      updateLegalSurfaces(queryClient, code, publicSurfaces),
    onSuccess: feedback.onSurfacesSaved,
    onError: feedback.onSurfacesError,
  });

  const translation = useMutation({
    mutationFn: ({
      code,
      locale: loc,
      title: t,
      content: c,
    }: {
      code: string;
      locale: string;
      title: string;
      content: string;
    }) =>
      updateLegalTranslation(
        queryClient,
        code,
        toLegalTranslationUpdate({ locale: loc, title: t, content: c }),
      ),
    onSuccess: (_data, vars) => {
      setDraft({ key: draftKey(vars.code, vars.locale), title: vars.title, content: vars.content });
      feedback.onTranslationSaved();
    },
    onError: feedback.onTranslationError,
  });

  return {
    documents,
    selected,
    locale,
    title: showing.title,
    content: showing.content,
    setTitle: (value: string) => {
      setDraft({ key, title: value, content: showing.content });
    },
    setContent: (value: string) => {
      setDraft({ key, title: showing.title, content: value });
    },
    isDirty,
    locales: selected ? (localesOf(selected) as BusinessLocale[]) : [...BUSINESS_LOCALES],
    selectDocument: (code: string) => {
      if (code === resolvedCode) return;
      requestSwitch({ kind: 'doc', code });
    },
    setLocale: (next: BusinessLocale) => {
      if (next === locale) return;
      requestSwitch({ kind: 'locale', locale: next });
    },
    discardOpen,
    keepEditing: () => {
      setDiscardOpen(false);
      setPendingSwitch(null);
    },
    discard: () => {
      const next = pendingSwitch;
      setDiscardOpen(false);
      setPendingSwitch(null);
      setDraft({ key, title: baseline.title, content: baseline.content });
      if (next?.kind === 'doc') applyDoc(next.code);
      else if (next?.kind === 'locale') applyLocale(next.locale);
    },
    hasUnsavedChanges: isDirty && !translation.isPending && !translation.isSuccess,
    isSavingStatus: (code: string) => status.isPending && status.variables.code === code,
    isSavingSurfaces: (code: string) => surfaces.isPending && surfaces.variables.code === code,
    isSavingTranslation: translation.isPending,
    setActive: (doc: LegalDocument, isActive: boolean) => {
      status.mutate({ code: doc.code, isActive });
    },
    setSurface: (doc: LegalDocument, surface: PublicSurface, enabled: boolean) => {
      const next = nextSurfaces(doc.publicSurfaces, surface, enabled);
      if (!next) return;
      surfaces.mutate({ code: doc.code, publicSurfaces: next });
    },
    saveTranslation: () => {
      if (!selected) return;
      translation.mutate({ code: selected.code, locale, title: showing.title, content: showing.content });
    },
  };
}
