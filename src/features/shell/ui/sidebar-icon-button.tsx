import { cn } from '@/shared/lib/cn';
import { Button, Icon, type IconName, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';

type SidebarIconButtonProps = {
  icon: IconName;
  label: string;
  onClick?: () => void;
  /** The compact footer's button: 20px icon, 40x36 minimum shrunk by compact density to 32x28. */
  small?: boolean;
};

/** An IconButton on the sidebar: muted text color, with its label as a tooltip. */
export function SidebarIconButton({ icon, label, onClick, small = false }: SidebarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="icon"
          aria-label={label}
          onClick={onClick}
          className={cn('text-sidebar-muted', small && 'h-7 w-8 min-h-0')}
        >
          <Icon name={icon} size={20} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
