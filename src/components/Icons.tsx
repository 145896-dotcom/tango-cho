import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 22, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
}

export function IconBack(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  )
}

export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.4 2.7 2.7L16.4 9" />
    </svg>
  )
}

export function IconVolume(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9.5h3L12 5v14l-5-4.5H4z" />
      <path d="M16 8.6a5 5 0 0 1 0 6.8" />
      <path d="M18.7 6a9 9 0 0 1 0 12" />
    </svg>
  )
}

export function IconVolumeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9.5h3L12 5v14l-5-4.5H4z" />
      <path d="m16.5 9.5 5 5" />
      <path d="m21.5 9.5-5 5" />
    </svg>
  )
}

export function IconMore(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconHelp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.7.3-1 .9-1 1.6v.3" />
      <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function IconSparkles(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 3v3M17 4.5h3" />
    </svg>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function IconList(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  )
}

export function IconLayers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3.5 8.5 4.3L12 12 3.5 7.8z" />
      <path d="m4 12.4 8 4 8-4" />
      <path d="m4 16.8 8 4 8-4" />
    </svg>
  )
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  )
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V9.5M10 20V4.5M16 20v-6.5M22 20H2" />
    </svg>
  )
}

export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 1-2-2z" />
      <path d="M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2z" />
    </svg>
  )
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 19.5h16" />
    </svg>
  )
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20.5v-11" />
      <path d="m7.5 13.5 4.5-4.5 4.5 4.5" />
      <path d="M4 4.5h16" />
    </svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="m6 7 1 12.5h10L18 7" />
      <path d="M10.5 11v5M13.5 11v5" />
    </svg>
  )
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v5h-5" />
    </svg>
  )
}

export function IconBulb(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 17.5h5" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.9 1 .9 1.7v1.4h5v-1.4c0-.7.4-1.3.9-1.7A6 6 0 0 0 12 3z" />
    </svg>
  )
}

export function IconFlame(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3s5.5 4.4 5.5 9.3A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.7C6.5 9 9 7.4 9 7.4c.2 2 1.1 3 2.2 3.4C11.9 9.2 12 6.4 12 3z" />
      <path d="M9.6 20.5h4.8" />
    </svg>
  )
}

export function IconSliders(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
      <circle cx="15" cy="8" r="2.2" />
      <circle cx="9" cy="16" r="2.2" />
    </svg>
  )
}

export function IconRotate(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.2 4.5v4.2h4.2" />
    </svg>
  )
}

export function IconCheckSquare(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="m8 12.2 2.7 2.7L16.3 9" />
    </svg>
  )
}

export function IconSquare(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    </svg>
  )
}
