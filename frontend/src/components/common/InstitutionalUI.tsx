import React from 'react';

// StatusBadge Component
interface StatusBadgeProps {
  status: 'demonstrated' | 'emerging' | 'not_yet_demonstrated' | 'not_assessed' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();
  
  if (normalized === 'demonstrated') {
    return (
      <span className={`inline-flex items-center gap-1 font-sans font-semibold tracking-wide uppercase border rounded-xs ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } bg-[#EDF3EE] text-[#3B5E43] border-[#C6D8CA]`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4F7658]" />
        Demonstrated
      </span>
    );
  }
  
  if (normalized === 'emerging') {
    return (
      <span className={`inline-flex items-center gap-1 font-sans font-semibold tracking-wide uppercase border rounded-xs ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } bg-[#FAF4EB] text-[#8F6627] border-[#E5D8C1]`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#A87932]" />
        Emerging
      </span>
    );
  }
  
  if (normalized === 'not_yet_demonstrated' || normalized === 'not_yet') {
    return (
      <span className={`inline-flex items-center gap-1 font-sans font-semibold tracking-wide uppercase border rounded-xs ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } bg-[#F9EDED] text-[#873F3F] border-[#DFC1C1]`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#9A4A4A]" />
        Not Yet
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-1 font-sans font-medium tracking-wide uppercase border rounded-xs ${
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
    } bg-[#EFECE5] text-[#5F5F5F] border-[#D5CFC3]`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#8E8B82]" />
      Not Assessed
    </span>
  );
};

// PageHeader Component
interface PageHeaderProps {
  breadcrumb?: string;
  onBreadcrumbClick?: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumb,
  onBreadcrumbClick,
  title,
  subtitle,
  badge,
  actions
}) => {
  return (
    <div className="pb-4 mb-6 border-b border-[#D9D3C7] flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <button
            onClick={onBreadcrumbClick}
            className="text-[11px] font-sans font-medium uppercase tracking-wider text-[#8A2F35] hover:text-[#5E1E22] flex items-center gap-1 mb-1 transition-colors"
          >
            ← {breadcrumb}
          </button>
        )}
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17365D] tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2 py-0.5 text-[11px] font-sans font-semibold tracking-wider uppercase bg-[#F1EEE7] text-[#17365D] border border-[#D9D3C7] rounded-xs">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#666666] font-sans mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

// SectionHeader Component
interface SectionHeaderProps {
  label?: string;
  title: string;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, title, rightElement }) => {
  return (
    <div className="flex items-baseline justify-between border-b border-[#D9D3C7] pb-2 mb-3">
      <div>
        {label && (
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8A2F35]">
            {label}
          </p>
        )}
        <h2 className="text-base sm:text-lg font-serif font-semibold text-[#17365D]">
          {title}
        </h2>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};

// ActionButton Component
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'maroon' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-sans font-medium transition-colors select-none rounded-[4px] border";
  const sizeStyles = size === 'sm' 
    ? "px-2.5 py-1 text-xs h-7" 
    : "px-3.5 py-1.5 text-xs h-9";
  
  let variantStyles = "";
  if (variant === 'primary') {
    variantStyles = "bg-[#17365D] text-[#FCFBF8] border-[#17365D] hover:bg-[#0F243E]";
  } else if (variant === 'secondary') {
    variantStyles = "bg-[#FCFBF8] text-[#252525] border-[#D9D3C7] hover:bg-[#F1EEE7] hover:border-[#B8B0A2]";
  } else if (variant === 'maroon') {
    variantStyles = "bg-[#8A2F35] text-[#FCFBF8] border-[#8A2F35] hover:bg-[#6D2429]";
  } else if (variant === 'danger') {
    variantStyles = "bg-[#F9EDED] text-[#873F3F] border-[#DFC1C1] hover:bg-[#F2D7D7]";
  } else if (variant === 'ghost') {
    variantStyles = "bg-transparent text-[#666666] border-transparent hover:text-[#252525] hover:bg-[#F1EEE7]";
  }

  return (
    <button className={`${base} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};

// EditorialCallout Component
interface EditorialCalloutProps {
  title?: string;
  quote?: string;
  children?: React.ReactNode;
}

export const EditorialCallout: React.FC<EditorialCalloutProps> = ({ title, quote, children }) => {
  return (
    <div className="bg-[#F1EEE7] border border-[#D9D3C7] border-l-4 border-l-[#8A2F35] rounded-xs p-4 sm:p-5 my-4">
      {title && (
        <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8A2F35] mb-1">
          {title}
        </p>
      )}
      {quote && (
        <blockquote className="font-serif italic text-sm sm:text-base text-[#17365D] font-medium leading-snug">
          “{quote}”
        </blockquote>
      )}
      {children && (
        <div className="text-xs font-sans text-[#525252] mt-2 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
};

// StatBlock Component
interface StatBlockProps {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
}

export const StatBlock: React.FC<StatBlockProps> = ({ label, value, sublabel, highlight }) => {
  return (
    <div className={`p-3.5 border rounded-[4px] text-center ${
      highlight ? 'bg-[#FCFBF8] border-[#B8B0A2]' : 'bg-[#FCFBF8] border-[#D9D3C7]'
    }`}>
      <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#666666] mb-0.5">
        {label}
      </p>
      <p className="text-2xl font-serif font-bold text-[#17365D]">
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] font-sans text-[#737373] mt-0.5">
          {sublabel}
        </p>
      )}
    </div>
  );
};
