import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: ReactNode;
  iconColor?: string;
  delay?: number;
}

export function StatCard({ title, value, subtitle, trend, icon, iconColor = "text-primary", delay = 0 }: StatCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 opacity-0 animate-fade-in-scale hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>}
          {trend && <p className="text-xs sm:text-sm text-success font-medium mt-1 truncate">{trend}</p>}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
