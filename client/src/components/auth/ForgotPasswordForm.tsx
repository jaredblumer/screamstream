import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import IconInput from './IconInput';
import RecaptchaField from './RecaptchaField';
import { Mail, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordData } from './schemas';
import ReCAPTCHA from 'react-google-recaptcha';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type Props = {
  siteKey?: string;
  onBack: () => void;
  onRequestSent?: () => void;
};

export default function ForgotPasswordForm({ siteKey, onBack, onRequestSent }: Props) {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', recaptchaToken: '' },
  });

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', data);
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(message || 'Request failed');
      }
      return res.json() as Promise<{ message: string }>;
    },
    onSuccess: (data) => {
      if (onRequestSent) onRequestSent();

      toast({ title: 'Reset email sent', description: data.message });
      recaptchaRef.current?.reset();
      form.reset({ email: '', recaptchaToken: '' });
      onBack();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      recaptchaRef.current?.reset();
      form.setValue('recaptchaToken', '');
    },
  });

  const handleSubmit = (d: ForgotPasswordData) => mutation.mutate(d);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">
          Email
        </Label>
        <IconInput
          id="email"
          type="email"
          placeholder="Enter your email address"
          icon={Mail}
          register={form.register}
        />
        {form.formState.errors.email && (
          <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
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

      <Button type="submit" className="w-full horror-button-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          onClick={onBack}
          className="horror-button-outline flex items-center justify-center gap-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Login
        </Button>
      </div>
    </form>
  );
}
