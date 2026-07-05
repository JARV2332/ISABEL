import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-[1.75rem] bg-gradient-to-r from-muted via-muted/60 to-muted motion-reduce:animate-none",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
