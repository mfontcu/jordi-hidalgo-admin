// Design system (ADR-003, "Design system"): shadcn/ui primitives styled with the panel's tokens.
// Kit components hold no copy; labels arrive as props.
export { Icon, ICON_NAMES, type IconName } from './icons/icon';
export { PortalContainerContext } from './portal-container';
export { Button, buttonVariants } from './primitives/button';
export { Calendar, type CalendarLocale } from './primitives/calendar';
export { Card } from './primitives/card';
export { Checkbox } from './primitives/checkbox';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './primitives/dialog';
export { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from './primitives/drawer';
export { FieldError, Label } from './primitives/field';
export { Input } from './primitives/input';
export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger } from './primitives/popover';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './primitives/select';
export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './primitives/sheet';
export { Spinner } from './primitives/spinner';
export { Switch } from './primitives/switch';
export { Textarea } from './primitives/textarea';
export { showErrorToast, showToast, Toaster } from './primitives/toast';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './primitives/tooltip';
export {
  isThemeMode,
  resolveScheme,
  syncThemeClass,
  THEME_MODES,
  type ThemeMode,
  useThemeStore,
} from './theme/theme-store';
export * from './kit';
