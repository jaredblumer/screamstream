import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import IconInput from './IconInput';
import PasswordInput from './PasswordInput';
import RecaptchaField from './RecaptchaField';
import { Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema, InsertUser } from '@shared/schema';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { securePassword, usernameSchema } from './schemas';

type RegisterData = InsertUser & { recaptchaToken?: string };
type Props = { siteKey?: string };

export default function RegisterForm({ siteKey }: Props) {
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const form = useForm<RegisterData>({
    resolver: zodResolver(
      insertUserSchema.extend({
        username: usernameSchema,
        password: securePassword,
        recaptchaToken: z.string().optional(),
      })
    ),
    defaultValues: { username: '', password: '', email: '', recaptchaToken: '' },
  });
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const redirectAfterAuth = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    setLocation(redirect === 'watchlist' ? '/watchlist' : '/');
  };

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Account created!',
          description: 'Welcome to Scream Stream. Start discovering horror content.',
        });
        recaptchaRef.current?.reset();
        redirectAfterAuth();
      },
      onError: () => {
        recaptchaRef.current?.reset();
        form.setValue('recaptchaToken', '');
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-300">
          Username
        </Label>
        <IconInput
          id="username"
          placeholder="Choose a username"
          icon={User}
          register={form.register}
        />
        {form.formState.errors.username && (
          <p className="text-red-400 text-sm">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">
          Email
        </Label>
        <IconInput
          id="email"
          type="email"
          placeholder="john@example.com"
          icon={Mail}
          register={form.register}
        />
        {form.formState.errors.email && (
          <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">
          Password
        </Label>
        <PasswordInput id="password" placeholder="Create a password" register={form.register} />
        {form.formState.errors.password && (
          <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
        )}
      </div>

      <RecaptchaField
        siteKey={siteKey}
        recaptchaRef={recaptchaRef}
        onToken={(t) => {
          form.setValue('recaptchaToken', t);
          if (t) form.clearErrors('recaptchaToken');
        }}
      />

      <Button
        type="submit"
        className="w-full horror-button-primary"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
