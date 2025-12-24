import { cn } from "@/lib/utils";

export const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("mx-auto max-w-[980px] px-4 md:px-6 lg:max-w-[1200px]", className)}>
      {children}
    </div>
  );
};