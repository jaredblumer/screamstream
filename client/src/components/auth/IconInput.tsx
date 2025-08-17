import { memo } from 'react';
import { Input } from '@/components/ui/input';

type Props = {
  id: string;
  type?: string;
  placeholder?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (name: any) => any;
  className?: string;
};

const IconInput = memo(function IconInput({
  id,
  type = 'text',
  placeholder,
  icon: Icon,
  register,
  className = '',
}: Props) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`pl-10 horror-bg border-gray-700 text-white placeholder-gray-500 ${className}`}
        {...register(id as any)}
      />
    </div>
  );
});

export default IconInput;
