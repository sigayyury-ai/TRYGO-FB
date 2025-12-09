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
import { useNavigate } from 'react-router-dom';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterClick: () => void;
}

const LoginDialog: FC<LoginDialogProps> = ({
  open,
  onOpenChange,
  onRegisterClick,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      await login({ input: { email, password } }, (text) => text);

      setTimeout(() => {
        toast({
          title: 'Login successful',
          description: 'Welcome back to MVPLaunch!',
        });
        useUserStore.getState().setHasInitializedProject(true);
        onOpenChange(false);
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        toast({
          title: 'Login failed',
          description: err.message || 'An error occurred during login.',
          variant: 'destructive',
        });
      }, 1500);
    }
  };

  const handleForgotPassword = () => {
    onOpenChange(false);
    setShowForgotPassword(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-md bg-blue-50 border-blue-200'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-center mb-2 text-blue-900'>
              Log in to your account
            </DialogTitle>
            <DialogDescription className='text-center text-blue-700'>
              Welcome back to MVPLaunch
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4 pt-4'>
            <div className='space-y-2'>
              <label
                htmlFor='login-email'
                className='text-sm font-medium text-blue-800'
              >
                Email
              </label>
              <Input
                id='login-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                required
                className='w-full border-blue-300 focus:border-blue-500 bg-white'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <label
                  htmlFor='login-password'
                  className='text-sm font-medium text-blue-800'
                >
                  Password
                </label>
                <button
                  type='button'
                  onClick={handleForgotPassword}
                  className='text-xs text-blue-600 hover:text-blue-800 font-medium'
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id='login-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Enter your password'
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
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </Button>

            <div className='text-center pt-2'>
              <p className='text-blue-700 text-sm'>
                Don't have an account?{' '}
                <button
                  type='button'
                  onClick={onRegisterClick}
                  className='text-blue-600 hover:text-blue-800 font-medium underline'
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        onLoginClick={() => {
          setShowForgotPassword(false);
          onOpenChange(true);
        }}
      />
    </>
  );
};

export default LoginDialog;
