import { FormattedMessage } from 'react-intl';

import type { MessageId } from '@/shared/i18n';

import logoUrl from './assets/logo.png';

const FEATURES: { title: MessageId; subtitle: MessageId }[] = [
  { title: 'authBrandFeatureDayAgendaTitle', subtitle: 'authBrandFeatureDayAgendaSubtitle' },
  { title: 'authBrandFeatureScheduleTitle', subtitle: 'authBrandFeatureScheduleSubtitle' },
  { title: 'authBrandFeatureManagementTitle', subtitle: 'authBrandFeatureManagementSubtitle' },
];

/** Quiet column beside the form, from the desktop width (1024px). */
export function LoginBrandPanel() {
  return (
    <div className="hidden min-w-0 flex-1 items-center justify-center p-8 desktop:flex">
      <section className="w-full max-w-[460px]">
        <img src={logoUrl} alt="" width={72} height={72} className="size-[72px] rounded-lg object-cover" />
        <p className="mt-6 text-label text-muted-foreground">
          <FormattedMessage id="authBrandPanelEyebrow" />
        </p>
        <h2 className="mt-2 text-title text-foreground">
          <FormattedMessage id="adminBrandName" />
        </h2>
        <p className="mt-3 text-body text-muted-foreground">
          <FormattedMessage id="authBrandPanelTitle" />
        </p>
        <p className="mt-2 text-body text-muted-foreground">
          <FormattedMessage id="authBrandPanelBody" />
        </p>
        <ul className="mt-6 flex flex-col gap-4">
          {FEATURES.map(({ title, subtitle }) => (
            <li key={title} className="flex items-start gap-3">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-border" />
              <span className="flex flex-col gap-1">
                <span className="text-body-strong text-foreground">
                  <FormattedMessage id={title} />
                </span>
                <span className="text-body text-muted-foreground">
                  <FormattedMessage id={subtitle} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
