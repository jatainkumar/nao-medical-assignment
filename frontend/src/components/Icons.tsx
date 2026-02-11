import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
    size?: number;
};

function Icon({ size = 20, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        />
    );
}

export function IconStethoscope(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
            <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
            <circle cx="20" cy="10" r="2" />
        </Icon>
    );
}

export function IconUser(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
        </Icon>
    );
}

export function IconUserDoctor(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M20 21a8 8 0 0 0-16 0" />
            <path d="M14 5h4" />
            <path d="M16 3v4" />
        </Icon>
    );
}

export function IconUserPatient(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 0 0-16 0" />
            <path d="M9 11h6" />
        </Icon>
    );
}

export function IconSend(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22 11 13 2 9Z" />
        </Icon>
    );
}

export function IconMic(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
        </Icon>
    );
}

export function IconSearch(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </Icon>
    );
}

export function IconClipboard(props: IconProps) {
    return (
        <Icon {...props}>
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4" />
            <path d="M12 16h4" />
            <path d="M8 11h.01" />
            <path d="M8 16h.01" />
        </Icon>
    );
}

export function IconArrowLeft(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </Icon>
    );
}

export function IconMenu(props: IconProps) {
    return (
        <Icon {...props}>
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </Icon>
    );
}

export function IconX(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </Icon>
    );
}

export function IconPlus(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </Icon>
    );
}

export function IconMessageSquare(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Icon>
    );
}

export function IconHistory(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </Icon>
    );
}

export function IconLanguages(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
        </Icon>
    );
}

export function IconSquareStop(props: IconProps) {
    return (
        <Icon {...props}>
            <rect width="14" height="14" x="5" y="5" rx="2" />
        </Icon>
    );
}

export function IconAlertCircle(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </Icon>
    );
}

export function IconLoader(props: IconProps) {
    return (
        <Icon {...props} className={`icon-spin ${props.className || ''}`}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </Icon>
    );
}

export function IconChevronDown(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m6 9 6 6 6-6" />
        </Icon>
    );
}

export function IconHeartPulse(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 0 1 12 6.006a5 5 0 0 1 7.5 6.572" />
            <path d="M5 12h3l2-3 3 6 2-3h4" />
        </Icon>
    );
}

export function IconFolder(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </Icon>
    );
}

export function IconEdit(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </Icon>
    );
}

export function IconTrash(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
        </Icon>
    );
}

