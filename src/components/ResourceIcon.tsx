import {
  BookOpen,
  Building2,
  Bus,
  Droplets,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Wifi,
  Zap,
} from 'lucide-react';
import { ResourceId } from '../types/campus';

export function ResourceIcon({
  id,
  className = 'h-5 w-5',
}: {
  id: ResourceId;
  className?: string;
}) {
  switch (id) {
    case 'electricity':
      return <Zap className={className} />;
    case 'water':
      return <Droplets className={className} />;
    case 'internet':
      return <Wifi className={className} />;
    case 'labs':
      return <FlaskConical className={className} />;
    case 'classrooms':
      return <GraduationCap className={className} />;
    case 'library':
      return <BookOpen className={className} />;
    case 'hostel':
      return <Building2 className={className} />;
    case 'hospital':
      return <HeartPulse className={className} />;
    case 'transport':
      return <Bus className={className} />;
  }
}
