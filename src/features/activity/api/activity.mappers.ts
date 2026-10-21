import type { components } from '@/shared/api';

import type { ActivityItem } from './activity.keys';

type ActivityDto = components['schemas']['dto.AdminActivityListItem'];

export function toActivityItem(dto: ActivityDto): ActivityItem | null {
  if (dto.id === undefined || !dto.kind) return null;
  return {
    id: dto.id,
    kind: dto.kind,
    announce: dto.announce === true,
    read: dto.read === true,
    payload: {
      appointmentPublicId: dto.payload?.appointmentPublicId,
      serviceId: dto.payload?.serviceId,
      customerName: dto.payload?.customerName,
      businessDay: dto.payload?.businessDay,
      previousStart: dto.payload?.previousStart,
      nextStart: dto.payload?.nextStart,
      userId: dto.payload?.userId,
      slotWatchId: dto.payload?.slotWatchId,
      channel: dto.payload?.channel,
    },
  };
}

export function toActivityList(items: ActivityDto[] | undefined): ActivityItem[] {
  return (items ?? []).flatMap((item) => {
    const mapped = toActivityItem(item);
    return mapped ? [mapped] : [];
  });
}
