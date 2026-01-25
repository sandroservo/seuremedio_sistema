/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Componente de imagem para medicamentos
 */

import { 
  Pill, 
  Heart, 
  Thermometer, 
  Droplets,
  Brain,
  Eye,
  Bone,
  Baby,
  Sparkles,
  Shield,
  Flower2,
  Syringe,
  Stethoscope,
  Activity
} from 'lucide-react';
import Image from 'next/image';

interface MedicationImageProps {
  category: string;
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const categoryConfig: Record<string, { icon: React.ElementType; bgColor: string; iconColor: string }> = {
  'Analgésicos': { icon: Thermometer, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
  'Anti-inflamatórios': { icon: Activity, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
  'Antibióticos': { icon: Shield, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  'Anti-hipertensivos': { icon: Heart, bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
  'Antidiabéticos': { icon: Droplets, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  'Colesterol': { icon: Activity, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  'Anticoagulantes': { icon: Droplets, bgColor: 'bg-red-100', iconColor: 'text-red-500' },
  'Tireoide': { icon: Stethoscope, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  'Ansiolíticos': { icon: Brain, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  'Antidepressivos': { icon: Brain, bgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
  'Gripes e Resfriados': { icon: Thermometer, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  'Vitaminas': { icon: Sparkles, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
  'Estômago': { icon: Pill, bgColor: 'bg-lime-100', iconColor: 'text-lime-600' },
  'Laxantes': { icon: Droplets, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  'Antialérgicos': { icon: Flower2, bgColor: 'bg-rose-100', iconColor: 'text-rose-600' },
  'Disfunção Erétil': { icon: Heart, bgColor: 'bg-blue-100', iconColor: 'text-blue-500' },
  'Dermatológicos': { icon: Sparkles, bgColor: 'bg-pink-100', iconColor: 'text-pink-500' },
  'Vermífugos': { icon: Shield, bgColor: 'bg-teal-100', iconColor: 'text-teal-600' },
  'Contraceptivos': { icon: Baby, bgColor: 'bg-fuchsia-100', iconColor: 'text-fuchsia-600' },
};

const defaultConfig = { icon: Pill, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };

const sizeClasses = {
  sm: { container: 'h-12 w-12', icon: 'h-6 w-6' },
  md: { container: 'h-16 w-16', icon: 'h-8 w-8' },
  lg: { container: 'h-24 w-24', icon: 'h-12 w-12' },
};

export function MedicationImage({ category, name, image, size = 'md', className = '' }: MedicationImageProps) {
  const config = categoryConfig[category] || defaultConfig;
  const Icon = config.icon;
  const sizes = sizeClasses[size];

  // Se tem imagem, exibe a imagem real
  if (image) {
    return (
      <div 
        className={`${sizes.container} rounded-xl overflow-hidden flex-shrink-0 ${className}`}
        title={name}
      >
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback para ícone da categoria
  return (
    <div 
      className={`${sizes.container} ${config.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
      title={name}
    >
      <Icon className={`${sizes.icon} ${config.iconColor}`} />
    </div>
  );
}
