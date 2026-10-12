import { useIntl } from 'react-intl';

import { SegmentedTabs } from '@/shared/ui';

import { useBlockedSlotsTabs } from '../../hooks/use-blocked-slots-tabs';
import type { BlockedSlotTab } from '../../model/blocked-slots-search';
import { RecurringRulesSection } from '../recurring/recurring-rules-section';
import { textOf } from '../shared/labels';
import { PunctualSlotsSection } from './punctual-slots-section';

/**
 * `/schedule/blocked-slots` (BlockedSlotsScreen): the punctual and recurring tabs, each a list page
 * with the tabs over its summary.
 */
export function BlockedSlotsScreen() {
  const intl = useIntl();
  const text = textOf(intl);
  const { tab, setTab } = useBlockedSlotsTabs();
  const tabs = (
    <SegmentedTabs<BlockedSlotTab>
      label={text('adminNavBlockedSlots')}
      tabs={[
        { value: 'punctual', label: text('scheduleSectionPunctual'), icon: 'block_outlined' },
        { value: 'recurring', label: text('scheduleSectionRecurring'), icon: 'repeat_rounded' },
      ]}
      value={tab}
      onValueChange={setTab}
    />
  );
  return tab === 'punctual' ? <PunctualSlotsSection tabs={tabs} /> : <RecurringRulesSection tabs={tabs} />;
}
