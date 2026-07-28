import { NeuralOrbit } from "./NeuralOrbit";
import type { LoaderContext } from "@/lib/loader-messages";
import type { LucideIcon } from "lucide-react";

export function InlineSpinner({
  context = "generic",
  icon,
  className,
}: {
  context?: LoaderContext;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <NeuralOrbit
      size="sm"
      variant="bare"
      state="loading"
      context={context}
      icon={icon}
      showMessages={false}
      className={className}
    />
  );
}