import { useIntl } from 'react-intl';

import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui';

import type { AdminUser } from '../../model/admin-user';
import { hasOperationalAlerts, isNoShowRisk } from '../../model/client';

type BannerUser = Pick<AdminUser, 'noShowCountLast90Days' | 'internalNotes'>;

/**
 * AdminClientOperationalBanner: what the salon should know before booking a client, a no-show
 * risk and the internal notes; nothing without either. The appointment form shows it (phase 8).
 */
export function ClientOperationalBanner({ user }: { user: BannerUser }) {
  const intl = useIntl();
  if (!hasOperationalAlerts(user)) return null;
  const notes = user.internalNotes.trim();

  return (
    <div className="flex flex-col gap-3">
      {isNoShowRisk(user) && (
        <Section
          icon="warning_amber_rounded"
          title={intl.formatMessage({ id: 'appointmentClientRiskBannerTitle' })}
          body={intl.formatMessage(
            { id: 'appointmentClientRiskBannerBody' },
            { count: user.noShowCountLast90Days },
          )}
          className="border-warning-fg/18 bg-warning-bg text-warning-fg"
        />
      )}
      {notes && (
        <Section
          icon="sticky_note_2_outlined"
          title={intl.formatMessage({ id: 'appointmentClientInternalNotesTitle' })}
          body={notes}
          className="border-content-secondary/18 bg-surface-muted text-content-secondary"
        />
      )}
    </div>
  );
}

type SectionProps = { icon: IconName; title: string; body: string; className: string };

/** `_OperationalSection`: 14px padding, 16px corners, the tone's border at 18%, icon and text. */
function Section({ icon, title, body, className }: SectionProps) {
  return (
    <div className={cn('flex items-start gap-3 rounded-md border p-3.5', className)}>
      <Icon name={icon} size={22} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="leading-[1.3] font-extrabold">{title}</p>
        <p className="mt-1.5 leading-[1.45] whitespace-pre-line">{body}</p>
      </div>
    </div>
  );
}
