import { createFileRoute } from '@tanstack/react-router';

import {
  agendaBlockedSlotsQueryOptions,
  agendaBoundsOf,
  agendaRecurringRulesQueryOptions,
  agendaWorkingHoursQueryOptions,
  appointmentsListQueryOptions,
  DayAgendaScreen,
  dayAgendaSearchSchema,
  dayOf,
  scopeOf,
} from '@/features/appointments';
import { businessToday, dayEndInstant, dayStartInstant } from '@/shared/lib/business-time';

const ignore = () => undefined;

export const Route = createFileRoute('/_authed/schedule/day-agenda')({
  staticData: { screen: 'dayAgenda' },
  validateSearch: dayAgendaSearchSchema,
  loaderDeps: ({ search }) => {
    const today = businessToday();
    const day = dayOf(search, today);
    const scope = scopeOf(search);
    const bounds = agendaBoundsOf(day, scope);
    return {
      listParams: {
        page: 1,
        pageSize: scope === 'week' ? 500 : 100,
        search: '',
        status: 'all' as const,
        dateFrom: dayStartInstant(bounds.dateFrom),
        dateTo: dayEndInstant(bounds.dateTo),
      },
      blockedPageSize: scope === 'week' ? 200 : 50,
    };
  },
  loader: ({ context, deps }) => {
    void context.queryClient.query(appointmentsListQueryOptions(deps.listParams)).catch(ignore);
    void context.queryClient.query(agendaWorkingHoursQueryOptions()).catch(ignore);
    void context.queryClient
      .query(
        agendaBlockedSlotsQueryOptions(
          deps.listParams.dateFrom,
          deps.listParams.dateTo,
          deps.blockedPageSize,
        ),
      )
      .catch(ignore);
    void context.queryClient.query(agendaRecurringRulesQueryOptions()).catch(ignore);
  },
  component: DayAgendaScreen,
});
