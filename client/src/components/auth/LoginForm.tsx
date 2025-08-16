import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import IconInput from './IconInput';
import PasswordInput from './PasswordInput';
import RecaptchaField from './RecaptchaField';
import { User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginData } from './schemas';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

type Props = { siteKey?: string; onShowForgot: () => void };

export default function LoginForm({ siteKey, onShowForgot }: Props) {
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', recaptchaToken: '' },
  });
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const redirectAfterAuth = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    setLocation(redirect === 'watchlist' ? '/watchlist' : '/');
  };

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
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
          placeholder="Enter your username"
          icon={User}
          register={form.register}
        />
        {form.formState.errors.username && (
          <p className="text-red-400 text-sm">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">
          Password
        </Label>
        <PasswordInput id="password" placeholder="Enter your password" register={form.register} />
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
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
      </Button>

      <div className="text-center">
        <Button type="button" onClick={onShowForgot} className="horror-button-outline text-sm">
          Forgot your password?
        </Button>
      </div>
    </form>
  );
}
