import * as React from "react";
import { cn } from "../lib/utils";

interface DividerProps extends React.HTMLAttributes<HTMLElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Divider = React.forwardRef<HTMLElement, DividerProps>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role={decorative ? "none" : "separator"}
          aria-orientation="vertical"
          className={cn("inline-block h-full w-px bg-gray-200 dark:bg-gray-700", className)}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }

    return (
      <hr
        ref={ref as React.Ref<HTMLHRElement>}
        role={decorative ? "none" : "separator"}
        className={cn("border-0 border-t border-gray-200 dark:border-gray-700", className)}
        {...(props as React.HTMLAttributes<HTMLHRElement>)}
      />
    );
  },
);
Divider.displayName = "Divider";

export { Divider };
export type { DividerProps };
