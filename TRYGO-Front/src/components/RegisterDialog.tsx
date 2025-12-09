import { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import LoginDialog from "./LoginDialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { pushGTMEvent } from "@/lib/analitics";
import { sendToWebhook } from "@/api/sendToWebhook";
import { isTestEmail } from "@/utils/isTestEmail";
import { useNavigate } from "react-router-dom";

interface RegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterDialog: FC<RegisterDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      await register({ input: { email, password } }, (text) => text);

      if (!isTestEmail(email)) {
        await sendToWebhook(email);
      }


      pushGTMEvent({
        event: "signup",
        method: "email",
      });

      setTimeout(() => {
        toast({
          title: "Account created",
          description: "You've successfully registered your account.",
        });
        onOpenChange(false);
        // Navigate to dashboard where RequireProject will show GenerateProjectModal
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        toast({
          title: "Registration failed",
          description: err.message || "An error occurred during registration.",
          variant: "destructive",
        });
      }, 1500);
    }
  };

  const handleSwitchToLogin = () => {
    onOpenChange(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-blue-50 border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center mb-2 text-blue-900">
              Create your account
            </DialogTitle>
            <DialogDescription className="text-center text-blue-700">
              Get started with your free MVPLaunch account
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-blue-800"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border-blue-300 focus:border-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-blue-800"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="w-full border-blue-300 focus:border-blue-500 bg-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-blue-700 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <LoginDialog
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onRegisterClick={() => {
          setShowLoginModal(false);
          onOpenChange(true);
        }}
      />
    </>
  );
};

export default RegisterDialog;
