import { FC, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/useAuthStore';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
}

const ForgotPasswordDialog: FC<ForgotPasswordDialogProps> = ({
  open,
  onOpenChange,
  onLoginClick,
}) => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const { toast } = useToast();

  const { forgotPassword, changePassword } = useAuthStore();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await forgotPassword({ email });

      setTimeout(() => {
        toast({
          title: 'Reset code sent',
          description:
            "If an account exists, you'll receive a reset code by email.",
        });
        setStep('code');
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        toast({
          title: 'Reset failed',
          description:
            err.message || 'Failed to send reset code. Please try again later.',
          variant: 'destructive',
        });
      }, 1500);
    }
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetCode || !newPassword || newPassword !== confirmPassword) {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: 'Please make sure your passwords match.',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        input: { email, resetCode: Number(resetCode), newPassword },
      });

      setTimeout(() => {
        setIsLoading(false);
        onOpenChange(false);

        toast({
          title: 'Password reset successful',
          description:
            'Your password has been reset. You can now log in with your new password.',
        });

        onLoginClick();
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      toast({
        title: 'Reset failed',
        description:
          err.message || 'Failed to reset password. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md bg-blue-50 border-blue-200'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-center mb-2 text-blue-900'>
            {step === 'email' ? 'Reset your password' : 'Enter reset code'}
          </DialogTitle>
          <DialogDescription className='text-center text-blue-700'>
            {step === 'email'
              ? "Enter your email and we'll send you a code to reset your password"
              : 'Enter the code we sent to your email and create a new password'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={handleSubmitEmail} className='space-y-4 pt-4'>
            <div className='space-y-2'>
              <label
                htmlFor='reset-email'
                className='text-sm font-medium text-blue-800'
              >
                Email
              </label>
              <Input
                id='reset-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                required
                className='w-full border-blue-300 focus:border-blue-500 bg-white'
              />
            </div>

            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className='h-4 w-4 mr-2 animate-spin' />
                  Sending reset code...
                </>
              ) : (
                'Send reset code'
              )}
            </Button>

            <div className='text-center pt-2'>
              <p className='text-blue-700 text-sm'>
                Remember your password?{' '}
                <button
                  type='button'
                  onClick={onLoginClick}
                  className='text-blue-600 hover:text-blue-800 font-medium underline'
                >
                  Back to login
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitCode} className='space-y-4 pt-4'>
            <div className='space-y-2'>
              <label
                htmlFor='reset-code'
                className='text-sm font-medium text-blue-800'
              >
                Reset Code
              </label>
              <Input
                id='reset-code'
                type='text'
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder='Enter your reset code'
                required
                className='w-full border-blue-300 focus:border-blue-500 bg-white'
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='new-password'
                className='text-sm font-medium text-blue-800'
              >
                New Password
              </label>
              <Input
                id='new-password'
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Enter new password'
                required
                className='w-full border-blue-300 focus:border-blue-500 bg-white'
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='confirm-password'
                className='text-sm font-medium text-blue-800'
              >
                Confirm Password
              </label>
              <Input
                id='confirm-password'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Confirm your new password'
                required
                className='w-full border-blue-300 focus:border-blue-500 bg-white'
              />
            </div>

            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className='h-4 w-4 mr-2 animate-spin' />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className='text-center pt-2'>
              <p className='text-blue-700 text-sm'>
                <button
                  type='button'
                  onClick={() => setStep('email')}
                  className='text-blue-600 hover:text-blue-800 font-medium underline'
                >
                  Back to code request
                </button>
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
