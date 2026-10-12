import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { updateWebPageStatus, updateWebPageTranslation } from '../api/business.mutations';
import { BUSINESS_LOCALES, type BusinessLocale } from '../model/locales';
import { localesOf, toWebPageTranslationUpdate, translationFor, type WebPage } from '../model/web-page';

type Feedback = {
  onStatusSaved: () => void;
  onStatusError: (error: unknown) => void;
  onTranslationSaved: () => void;
  onTranslationError: (error: unknown) => void;
};

/** Optional URL sync: `doc` search param for the selected web page code. */
type Selection = {
  codeFromUrl?: string;
  onCodeChange?: (code: string) => void;
};

type Draft = { key: string; title: string; content: string };

const draftKey = (code: string | null, locale: string) => `${code ?? ''}:${locale}`;

/**
 * Web pages CMS: same master-detail translation pattern as legal, without public surfaces.
 */
export function useWebPages(pages: WebPage[], feedback: Feedback, selection?: Selection) {
  const queryClient = useQueryClient();
  const [selectedCode, setSelectedCode] = useState<string | null>(selection?.codeFromUrl ?? null);
  const [locale, setLocaleState] = useState<BusinessLocale>('es');
  const [draft, setDraft] = useState<Draft>({ key: ':', title: '', content: '' });
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<
    { kind: 'page'; code: string } | { kind: 'locale'; locale: BusinessLocale } | null
  >(null);

  const preferred = selectedCode ?? selection?.codeFromUrl ?? null;
  const resolvedCode =
    preferred && pages.some((page) => page.code === preferred) ? preferred : (pages[0]?.code ?? null);
  const selected = pages.find((page) => page.code === resolvedCode) ?? null;
  const key = draftKey(resolvedCode, locale);
  const baseline = selected ? translationFor(selected, locale) : { title: '', content: '' };
  const showing = draft.key === key ? draft : { key, title: baseline.title, content: baseline.content };
  const isDirty = showing.title !== baseline.title || showing.content !== baseline.content;

  const applyPage = (code: string) => {
    setSelectedCode(code);
    selection?.onCodeChange?.(code);
  };

  const codeFromUrl = selection?.codeFromUrl;
  const onCodeChange = selection?.onCodeChange;
  // Keep `?doc=` aligned with the resolved page once web is open.
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
    if (next.kind === 'page') applyPage(next.code);
    else applyLocale(next.locale);
  };

  const status = useMutation({
    mutationFn: ({ code, isActive }: { code: string; isActive: boolean }) =>
      updateWebPageStatus(queryClient, code, isActive),
    onSuccess: feedback.onStatusSaved,
    onError: feedback.onStatusError,
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
      updateWebPageTranslation(
        queryClient,
        code,
        toWebPageTranslationUpdate({ locale: loc, title: t, content: c }),
      ),
    onSuccess: (_data, vars) => {
      setDraft({ key: draftKey(vars.code, vars.locale), title: vars.title, content: vars.content });
      feedback.onTranslationSaved();
    },
    onError: feedback.onTranslationError,
  });

  return {
    pages,
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
    selectPage: (code: string) => {
      if (code === resolvedCode) return;
      requestSwitch({ kind: 'page', code });
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
      if (next?.kind === 'page') applyPage(next.code);
      else if (next?.kind === 'locale') applyLocale(next.locale);
    },
    hasUnsavedChanges: isDirty && !translation.isPending && !translation.isSuccess,
    isSavingStatus: (code: string) => status.isPending && status.variables.code === code,
    isSavingTranslation: translation.isPending,
    setActive: (page: WebPage, isActive: boolean) => {
      status.mutate({ code: page.code, isActive });
    },
    saveTranslation: () => {
      if (!selected) return;
      translation.mutate({ code: selected.code, locale, title: showing.title, content: showing.content });
    },
  };
}
