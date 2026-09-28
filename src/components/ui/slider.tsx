"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils/cn";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  showValue?: boolean;
  valueFormatter?: (val: number) => string;
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, showValue = true, valueFormatter, value, defaultValue, min = 0, max = 100, step = 1, ...props }, ref) => {
  const currentVal = value ? value[0] : (defaultValue ? defaultValue[0] : min);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-studio-400 font-medium">
          {label && <span>{label}</span>}
          {showValue && (
            <span className="font-mono text-studio-200">
              {valueFormatter ? valueFormatter(currentVal) : currentVal}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center cursor-pointer group py-1",
          className
        )}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-studio-800">
          <SliderPrimitive.Range className="absolute h-full bg-accent-blue group-hover:bg-blue-400 transition-colors" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-accent-blue ring-offset-studio-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 shadow-sm" />
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;
