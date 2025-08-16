import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PasswordInput from './PasswordInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordData } from './schemas';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

type Props = {
  token: string | null;
  onBackToLogin: () => void;
};

export default function ResetPasswordForm({ token, onBackToLogin }: Props) {
  const { toast } = useToast();
  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: async (args: { token: string | null; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/auth/reset-password', args);
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: 'Password reset successful', description: data.message });
      onBackToLogin();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: ResetPasswordData) =>
    mutation.mutate({ token, newPassword: data.newPassword });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-gray-300">
          New Password
        </Label>
        <PasswordInput
          id="newPassword"
          placeholder="Enter your new password"
          register={form.register}
        />
        {form.formState.errors.newPassword && (
          <p className="text-red-400 text-sm">{form.formState.errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-300">
          Confirm Password
        </Label>
        <PasswordInput
          id="confirmPassword"
          placeholder="Confirm your new password"
          register={form.register}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-red-400 text-sm">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full horror-button-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Resetting...' : 'Reset Password'}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          onClick={onBackToLogin}
          className="horror-button-outline flex items-center justify-center gap-1 text-sm"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Login
        </Button>
      </div>
    </form>
  );
}
