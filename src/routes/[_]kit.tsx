import { createFileRoute, notFound } from '@tanstack/react-router';
import { lazy } from 'react';
import { z } from 'zod';

import type { KitMode } from '@/features/dev-kit';

// Development only: in a production build `import.meta.env.DEV` is false, so the route answers
// "not found" and the kit's code is left out of the bundle.
const KitScreen = import.meta.env.DEV
  ? lazy(() => import('@/features/dev-kit').then((module) => ({ default: module.KitScreen })))
  : null;

const kitSearchSchema = z.object({
  mode: z.enum(['both', 'light', 'dark'] satisfies KitMode[]).catch('both'),
});

export const Route = createFileRoute('/_kit')({
  validateSearch: kitSearchSchema,
  beforeLoad: () => {
    if (!KitScreen) throw notFound();
  },
  component: KitRoute,
});

function KitRoute() {
  const { mode } = Route.useSearch();
  const navigate = Route.useNavigate();
  if (!KitScreen) return null;
  return <KitScreen mode={mode} onModeChange={(next) => void navigate({ search: { mode: next } })} />;
}
