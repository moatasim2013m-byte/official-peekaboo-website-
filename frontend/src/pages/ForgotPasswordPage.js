import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Check your email for reset instructions');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4">
      <Card className="w-full max-w-md border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">🔐</span>
          </div>
          <CardTitle className="font-heading text-3xl" data-testid="forgot-title">Forgot Password?</CardTitle>
          <CardDescription className="text-base">
            {sent 
              ? 'Check your email for reset instructions'
              : 'No worries! Enter your email and we\'ll send you a reset link'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-6">
              <div className="bg-primary/10 rounded-2xl p-6">
                <p className="text-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl h-12"
                    required
                    data-testid="forgot-email"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-full h-12 text-lg btn-playful"
                disabled={loading}
                data-testid="forgot-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-primary hover:underline inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
