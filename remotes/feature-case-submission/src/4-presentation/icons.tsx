import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 4 7l8 4 8-4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export function ImpressionIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15c1-6 6-9 8-9s7 3 8 9" />
      <path d="M4 15c0 2 2 4 8 4s8-2 8-4" />
    </svg>
  );
}

export function PrescriptionIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v3h6V3" />
      <path d="M12 11v5M9.5 13.5h5" />
    </svg>
  );
}

export function SummaryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="5" y1="7" x2="5.01" y2="7" />
      <line x1="9" y1="7" x2="19" y2="7" />
      <line x1="5" y1="12" x2="5.01" y2="12" />
      <line x1="9" y1="12" x2="19" y2="12" />
      <line x1="5" y1="17" x2="5.01" y2="17" />
      <line x1="9" y1="17" x2="19" y2="17" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.4 2.4L15.5 9.5" />
    </svg>
  );
}

export function StepsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 16V8l4-4" />
      <path d="M4 16h5v-5" />
      <path d="M13 20V4M13 4l4 4M13 4l-4 4" />
    </svg>
  );
}

export function DurationIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function RefinementIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17 3 21 7l-4 4" />
      <path d="M3 7h13" />
      <path d="M7 21 3 17l4-4" />
      <path d="M21 17H8" />
    </svg>
  );
}

export function RevisionIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4v6h6" />
      <path d="M20 20v-6h-6" />
      <path d="M20 10a8 8 0 0 0-14.6-4.6L4 8" />
      <path d="M4 14a8 8 0 0 0 14.6 4.6L20 16" />
    </svg>
  );
}

export function RetainerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 14c1-5 5-7 8-7s7 2 8 7" />
      <path d="M4 14c0 1.6 3.6 3 8 3s8-1.4 8-3" />
      <path d="M4 14v1.5c0 1.6 3.6 3 8 3s8-1.4 8-3V14" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 15 15 9" />
      <path d="M11 6.5 12.5 5a3.5 3.5 0 1 1 5 5L16 11.5" />
      <path d="M13 17.5 11.5 19a3.5 3.5 0 1 1-5-5L8 12.5" />
    </svg>
  );
}
