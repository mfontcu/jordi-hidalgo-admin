import { useId, useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { DateRange } from 'react-day-picker';

import type { MessageId } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  Calendar,
  type CalendarLocale,
  Card,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FieldError,
  Icon,
  ICON_NAMES,
  type IconName,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  showErrorToast,
  showToast,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';

import { KIT_COLOR_GROUPS, KIT_RADIUS, KIT_SPACING, KIT_TONES, KIT_TYPE_SCALE } from '../model/kit-mode';

// Literal class names, so Tailwind finds them when it scans the source.
const TYPE_CLASS: Record<(typeof KIT_TYPE_SCALE)[number], string> = {
  'headline-lg': 'text-headline-lg',
  'headline-md': 'text-headline-md',
  'headline-sm': 'text-headline-sm',
  'title-lg': 'text-title-lg',
  'title-md': 'text-title-md',
  'title-sm': 'text-title-sm',
  'body-lg': 'text-body-lg',
  'body-md': 'text-body-md text-on-surface-secondary',
  'body-sm': 'text-body-sm text-on-surface-muted',
  'label-lg': 'text-label-lg',
  'label-md': 'text-label-md',
  'label-sm': 'text-label-sm',
  button: 'text-button font-extrabold',
};

const TONE_CLASS: Record<(typeof KIT_TONES)[number], string> = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info-fg',
};

const TONE_LABEL: Record<(typeof KIT_TONES)[number], MessageId> = {
  success: 'appointmentStatusCompleted',
  warning: 'appointmentStatusPending',
  danger: 'appointmentStatusCancelled',
  info: 'appointmentStatusConfirmed',
};

const STATUS_OPTIONS: MessageId[] = [
  'appointmentStatusPending',
  'appointmentStatusConfirmed',
  'appointmentStatusCompleted',
  'appointmentStatusCancelled',
  'appointmentStatusNoShow',
];

const SIDEBAR_ITEMS: { icon: IconName; label: MessageId; active?: boolean }[] = [
  { icon: 'dashboard_outlined', label: 'adminNavDashboard' },
  { icon: 'event_available_outlined', label: 'adminNavAppointments', active: true },
  { icon: 'people_outline', label: 'adminNavClients' },
  { icon: 'content_cut_outlined', label: 'adminNavServices' },
];

/** A titled block of the kit, drawn as an admin section card. */
function KitSection({ title, children }: { title: MessageId; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-title-lg">
        <FormattedMessage id={title} />
      </h2>
      {children}
    </section>
  );
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>;
}

function Caption({ children }: { children: ReactNode }) {
  return <code className="font-mono text-label-sm text-content-muted">{children}</code>;
}

export function ColorsSection() {
  return (
    <KitSection title="devKitSectionColors">
      {Object.entries(KIT_COLOR_GROUPS).map(([group, tokens]) => (
        <div key={group} className="flex flex-col gap-2">
          <Caption>{group}</Caption>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
            {tokens.map((token) => (
              <div key={token} className="flex items-center gap-2">
                <span
                  className="size-8 shrink-0 rounded-xs border border-outline-variant"
                  style={{ background: `var(--${token})` }}
                />
                <Caption>{token}</Caption>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Row>
        {KIT_TONES.map((tone) => (
          <span
            key={tone}
            className={cn('rounded-pill px-3 py-1.5 text-label-md font-bold', TONE_CLASS[tone])}
          >
            <FormattedMessage id={TONE_LABEL[tone]} />
          </span>
        ))}
      </Row>
    </KitSection>
  );
}

export function TypographySection() {
  return (
    <KitSection title="devKitSectionTypography">
      {KIT_TYPE_SCALE.map((name) => (
        <div key={name} className="flex flex-col gap-0.5">
          <Caption>{name}</Caption>
          <p className={TYPE_CLASS[name]}>
            <FormattedMessage id="adminNavPanelSubtitle" />
          </p>
        </div>
      ))}
    </KitSection>
  );
}

export function SpacingSection() {
  return (
    <KitSection title="devKitSectionSpacing">
      <div className="flex flex-wrap items-end gap-4">
        {KIT_SPACING.map(([name, px]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <span className="block h-8 bg-accent-fg" style={{ width: px }} />
            <Caption>{name}</Caption>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {KIT_RADIUS.map(([name, px]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <span
              className="block size-14 border border-outline bg-surface-muted"
              style={{ borderRadius: px }}
            />
            <Caption>{name}</Caption>
          </div>
        ))}
      </div>
    </KitSection>
  );
}

export function IconsSection() {
  return (
    <KitSection title="devKitSectionIcons">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {ICON_NAMES.map((name) => (
          <div key={name} className="flex items-center gap-2 text-on-surface-variant">
            <Icon name={name} />
            <Caption>{name}</Caption>
          </div>
        ))}
      </div>
      <Row>
        <span className="flex size-10 items-center justify-center rounded-sm bg-icon-accent-bg text-icon-accent">
          <Icon name="event_available_outlined" size={20} />
        </span>
      </Row>
    </KitSection>
  );
}

export function ButtonsSection() {
  const intl = useIntl();
  const save = <FormattedMessage id="adminCommonSave" />;
  return (
    <KitSection title="devKitSectionButtons">
      <Row>
        <Button>{save}</Button>
        <Button icon="save_outlined">{save}</Button>
        <Button loading>
          <FormattedMessage id="adminCommonSaving" />
        </Button>
        <Button disabled>{save}</Button>
      </Row>
      <Row>
        <Button variant="secondary">
          <FormattedMessage id="adminCommonCancel" />
        </Button>
        <Button variant="secondary" icon="close_rounded">
          <FormattedMessage id="adminCommonCancel" />
        </Button>
        <Button variant="secondary" disabled>
          <FormattedMessage id="adminCommonCancel" />
        </Button>
      </Row>
      <Row>
        <Button variant="danger">
          <FormattedMessage id="adminCommonDelete" />
        </Button>
        <Button variant="danger" icon="delete_outline">
          <FormattedMessage id="adminCommonDelete" />
        </Button>
        <Button variant="danger" disabled>
          <FormattedMessage id="adminCommonDelete" />
        </Button>
      </Row>
      <Row>
        <Button variant="text">
          <FormattedMessage id="adminCommonViewDetail" />
        </Button>
        <Button variant="text" icon="add">
          <FormattedMessage id="adminCommonNew" />
        </Button>
        <Button variant="text" disabled>
          <FormattedMessage id="adminCommonViewDetail" />
        </Button>
        <Button
          variant="icon"
          icon="close"
          aria-label={intl.formatMessage({ id: 'adminCommonClearSearch' })}
        />
        <Button
          variant="icon"
          icon="tune_rounded"
          aria-label={intl.formatMessage({ id: 'adminCommonSearch' })}
        />
      </Row>
      <Button className="w-full" icon="check_rounded">
        <FormattedMessage id="adminCommonApply" />
      </Button>
    </KitSection>
  );
}

export function FieldsSection() {
  const intl = useIntl();
  const searchPlaceholder = intl.formatMessage({ id: 'adminCommonSearch' });
  const labeledFieldId = useId();
  return (
    <KitSection title="devKitSectionFields">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
        <Input
          defaultValue={intl.formatMessage({ id: 'adminNavPanelSubtitle' })}
          aria-label={searchPlaceholder}
        />
        <Input
          aria-invalid
          defaultValue={intl.formatMessage({ id: 'adminNavPanelSubtitle' })}
          aria-label={intl.formatMessage({ id: 'devKitStateInvalid' })}
        />
        <Input
          disabled
          placeholder={intl.formatMessage({ id: 'devKitStateDisabled' })}
          aria-label={intl.formatMessage({ id: 'devKitStateDisabled' })}
        />
      </div>
      <Textarea
        placeholder={intl.formatMessage({ id: 'appointmentFormNotesHint' })}
        aria-label={intl.formatMessage({ id: 'appointmentFormNotesLabel' })}
      />
      {/* Card, Label and FieldError, as the login form uses them. */}
      <Card className="p-6">
        <Label htmlFor={labeledFieldId}>
          <FormattedMessage id="authEmailLabel" />
        </Label>
        <Input
          id={labeledFieldId}
          className="mt-2"
          aria-invalid
          aria-describedby={`${labeledFieldId}-error`}
          placeholder={intl.formatMessage({ id: 'authEmailHint' })}
        />
        <FieldError id={`${labeledFieldId}-error`}>
          <FormattedMessage id="authEmailInvalid" />
        </FieldError>
      </Card>
    </KitSection>
  );
}

export function SelectSection() {
  const intl = useIntl();
  return (
    <KitSection title="devKitSectionSelect">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select>
          <SelectTrigger aria-label={intl.formatMessage({ id: 'adminCommonAll' })}>
            <SelectValue placeholder={intl.formatMessage({ id: 'adminCommonAll' })} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((id) => (
              <SelectItem key={id} value={id}>
                <FormattedMessage id={id} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger aria-label={intl.formatMessage({ id: 'devKitStateDisabled' })}>
            <SelectValue placeholder={intl.formatMessage({ id: 'devKitStateDisabled' })} />
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>
    </KitSection>
  );
}

function Labeled({ children, label }: { children: ReactNode; label: MessageId }) {
  return (
    <label className="flex items-center text-body-md text-on-surface">
      {children}
      <FormattedMessage id={label} />
    </label>
  );
}

export function ChoiceSection() {
  const [on, setOn] = useState(true);
  return (
    <KitSection title="devKitSectionChoice">
      <Row className="gap-x-6 gap-y-0">
        <Labeled label="appointmentStatusPending">
          <Checkbox />
        </Labeled>
        <Labeled label="appointmentStatusConfirmed">
          <Checkbox defaultChecked />
        </Labeled>
        <Labeled label="devKitStateIndeterminate">
          <Checkbox checked="indeterminate" />
        </Labeled>
        <Labeled label="devKitStateInvalid">
          <Checkbox aria-invalid />
        </Labeled>
        <Labeled label="devKitStateDisabled">
          <Checkbox disabled />
        </Labeled>
        <Labeled label="devKitStateDisabled">
          <Checkbox disabled defaultChecked />
        </Labeled>
      </Row>
      <Row className="gap-x-6 gap-y-0">
        <Labeled label="adminAppearanceDark">
          <Switch checked={on} onCheckedChange={setOn} />
        </Labeled>
        <Labeled label="adminAppearanceLight">
          <Switch />
        </Labeled>
        <Labeled label="devKitStateDisabled">
          <Switch disabled />
        </Labeled>
        <Labeled label="devKitStateDisabled">
          <Switch disabled defaultChecked />
        </Labeled>
      </Row>
    </KitSection>
  );
}

export function OverlaysSection({ language, toasterId }: { language: CalendarLocale; toasterId: string }) {
  const intl = useIntl();
  const [date, setDate] = useState<Date | undefined>();
  return (
    <KitSection title="devKitSectionOverlays">
      <Row>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <FormattedMessage id="devKitOpenDialog" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <FormattedMessage id="legalUnsavedChangesTitle" />
              </DialogTitle>
              <DialogDescription>
                <FormattedMessage id="legalUnsavedChangesBody" />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">
                  <FormattedMessage id="adminCommonCancel" />
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">
                  <FormattedMessage id="legalDiscard" />
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">
              <FormattedMessage id="devKitOpenSheet" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetBody>
              <SheetHeader>
                <SheetTitle>
                  <FormattedMessage id="adminDateRangeDefaultTitle" />
                </SheetTitle>
                <SheetDescription>
                  <FormattedMessage id="adminDateRangeDefaultSubtitle" />
                </SheetDescription>
              </SheetHeader>
              <RangeCalendar language={language} />
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="secondary" icon="close_rounded">
                    <FormattedMessage id="adminCommonCancel" />
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button icon="check_rounded">
                    <FormattedMessage id="adminCommonApply" />
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetBody>
          </SheetContent>
        </Sheet>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" icon="calendar_today_outlined">
              <FormattedMessage id="devKitOpenPopover" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px]">
            <Calendar mode="single" language={language} selected={date} onSelect={setDate} />
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="icon"
              icon="info_outline"
              aria-label={intl.formatMessage({ id: 'adminNavCollapseMenu' })}
            />
          </TooltipTrigger>
          <TooltipContent>
            <FormattedMessage id="adminNavCollapseMenu" />
          </TooltipContent>
        </Tooltip>
      </Row>
      <Row>
        <Button
          variant="secondary"
          onClick={() =>
            showToast(intl.formatMessage({ id: 'appointmentStatusUpdatedSnackbar' }), { toasterId })
          }
        >
          <FormattedMessage id="devKitShowToast" />
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            showErrorToast(intl.formatMessage({ id: 'appointmentStatusUpdateFailed' }), { toasterId })
          }
        >
          <FormattedMessage id="devKitShowErrorToast" />
        </Button>
      </Row>
    </KitSection>
  );
}

function RangeCalendar({ language }: { language: CalendarLocale }) {
  const [range, setRange] = useState<DateRange | undefined>();
  return <Calendar mode="range" language={language} selected={range} onSelect={setRange} />;
}

export function CalendarSection({ language }: { language: CalendarLocale }) {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <KitSection title="devKitSectionCalendar">
      <div className="flex flex-wrap gap-6">
        <div className="flex w-[360px] max-w-full flex-col gap-2">
          <Caption>
            <FormattedMessage id="devKitCalendarSingle" />
          </Caption>
          <Calendar mode="single" language={language} selected={date} onSelect={setDate} />
        </div>
        <div className="flex w-[360px] max-w-full flex-col gap-2">
          <Caption>
            <FormattedMessage id="devKitCalendarRange" />
          </Caption>
          <RangeCalendar language={language} />
        </div>
      </div>
    </KitSection>
  );
}

/** Sample of the always-dark sidebar (admin_sidebar.dart), to check its tokens in both modes. */
export function SidebarSection() {
  return (
    <KitSection title="devKitSectionSidebar">
      <nav className="flex w-64 flex-col gap-1 rounded-lg bg-sidebar-background p-3">
        <div className="mb-2 flex flex-col rounded-md bg-sidebar-surface p-3">
          <span className="text-title-md font-extrabold text-sidebar-foreground">
            <FormattedMessage id="adminBrandName" />
          </span>
          <span className="text-body-sm text-sidebar-foreground-muted">
            <FormattedMessage id="adminNavPanelSubtitle" />
          </span>
        </div>
        {SIDEBAR_ITEMS.map(({ icon, label, active }) => (
          <span
            key={label}
            className={cn(
              'flex items-center gap-3 rounded-sm border px-3 py-2.5 text-label-lg font-bold',
              active
                ? 'border-sidebar-accent-border bg-sidebar-accent-bg text-sidebar-accent-fg'
                : 'border-transparent text-sidebar-foreground-muted',
            )}
          >
            <Icon name={icon} size={20} />
            <FormattedMessage id={label} />
          </span>
        ))}
      </nav>
    </KitSection>
  );
}
