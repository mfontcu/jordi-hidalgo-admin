import { FormattedMessage, useIntl } from 'react-intl';

import type { MessageId } from '@/shared/i18n';

import logoUrl from './assets/logo.png';

const FEATURES: { title: MessageId; subtitle: MessageId }[] = [
  { title: 'authBrandFeatureDayAgendaTitle', subtitle: 'authBrandFeatureDayAgendaSubtitle' },
  { title: 'authBrandFeatureScheduleTitle', subtitle: 'authBrandFeatureScheduleSubtitle' },
  { title: 'authBrandFeatureManagementTitle', subtitle: 'authBrandFeatureManagementSubtitle' },
];

/** login_brand_panel.dart: the left half of the login screen, shown on desktop only. */
export function LoginBrandPanel() {
  const intl = useIntl();

  return (
    // The card fills the height and keeps its content at the top (a Column with mainAxisSize.max).
    <div className="hidden min-w-0 flex-1 justify-center bg-surface p-8 desktop:flex">
      <section className="w-full max-w-[460px] overflow-y-auto rounded-xl border border-outline-variant bg-surface p-6 shadow-[0_6px_14px_rgb(0_0_0/0.06)]">
        <div className="h-1 w-[88px] rounded-pill bg-linear-to-r from-brand-red via-on-surface to-brand-blue" />
        <img
          src={logoUrl}
          alt={intl.formatMessage({ id: 'adminBrandName' })}
          width={108}
          height={108}
          className="mt-6 size-[108px] rounded-lg object-cover"
        />
        <p className="mt-6 font-bold text-content-secondary">
          <FormattedMessage id="authBrandPanelEyebrow" />
        </p>
        <h2 className="mt-2 text-login-brand-title font-black text-on-surface">
          <FormattedMessage id="authBrandPanelTitle" />
        </h2>
        <p className="mt-3 text-login-brand-body text-content-secondary">
          <FormattedMessage id="authBrandPanelBody" />
        </p>
        <ul className="mt-6 flex flex-col gap-4">
          {FEATURES.map(({ title, subtitle }) => (
            <li key={title} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1 size-3 shrink-0 rounded-pill bg-linear-to-r from-brand-red to-brand-blue"
              />
              <span className="flex flex-col gap-1">
                <span className="font-extrabold text-on-surface">
                  <FormattedMessage id={title} />
                </span>
                <span className="leading-[1.45] text-content-secondary">
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
