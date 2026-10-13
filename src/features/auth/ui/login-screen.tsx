import { useIntl } from 'react-intl';

import { showToast, Toaster } from '@/shared/ui';

import { useLoginForm } from '../hooks/use-login-form';
import { useSessionExpiredNotice } from '../hooks/use-session-expired-notice';
import { LoginBrandPanel } from './login-brand-panel';
import { LoginFormCard } from './login-form-card';

type LoginScreenProps = {
  /** Opens the requested path once the staff member is signed in. */
  onSignedIn: () => void;
};

/** Brand column and form side by side from 1024px; the form alone below that. */
export function LoginScreen({ onSignedIn }: LoginScreenProps) {
  const intl = useIntl();
  const form = useLoginForm({ onSignedIn });

  useSessionExpiredNotice(() => {
    showToast(intl.formatMessage({ id: 'authSessionExpired' }));
  });

  return (
    <div className="flex min-h-dvh bg-background">
      <LoginBrandPanel />
      <main className="flex min-w-0 flex-1 items-center justify-center overflow-y-auto p-6 desktop:p-8">
        <div className="w-full max-w-[420px] desktop:max-w-[440px]">
          <LoginFormCard form={form} />
        </div>
      </main>
      {/* Its own toaster, as each Flutter page has its ScaffoldMessenger; it mounts before the
          expiry notice is shown. Keeping toasts out of the root leaves sonner out of the first load. */}
      <Toaster />
    </div>
  );
}
