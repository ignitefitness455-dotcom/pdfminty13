import * as React from "react"

import { cn } from "../../lib/utils"

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "default";
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, size = "default", checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        data-slot="switch"
        data-size={size}
        onClick={(e) => {
          onCheckedChange?.(!checked);
          props.onClick?.(e);
        }}
        className={cn(
          "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/50 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-rose-500/50 dark:aria-invalid:ring-rose-500/40 data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block rounded-full bg-white ring-0 transition-transform dark:bg-white group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
            checked
              ? "translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:translate-x-[calc(100%-2px)]"
              : "translate-x-0"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
