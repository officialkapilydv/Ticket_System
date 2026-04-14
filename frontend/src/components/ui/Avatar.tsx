import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover flex-shrink-0', sizes[size])}
      />
    );
  }

  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <span
      className={clsx(
        'rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center flex-shrink-0',
        sizes[size]
      )}
    >
      {initials}
    </span>
  );
}
