import { useAuth } from '../context/AuthContext';

interface AdSlotProps {
  id: string;
  className?: string;
}

// Renders an AdSense placeholder for non-premium visitors.
// Premium users see nothing — pass className for layout spacing if needed.
export default function AdSlot({ id, className = '' }: AdSlotProps) {
  const { isPremium } = useAuth();
  if (isPremium) return null;
  return (
    <div
      id={id}
      className={className}
      aria-hidden="true"
      data-ad-slot={id}
    />
  );
}
