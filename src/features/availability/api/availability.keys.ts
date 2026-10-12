/** Query keys of the availability feature. */
export const availabilityKeys = {
  all: ['availability'] as const,
  services: () => [...availabilityKeys.all, 'services'] as const,
  dates: (serviceId: string) => [...availabilityKeys.all, 'dates', serviceId] as const,
  slots: (serviceId: string, day: string) => [...availabilityKeys.all, 'slots', serviceId, day] as const,
};
