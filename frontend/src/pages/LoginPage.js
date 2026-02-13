import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import mascotImg from '../assets/mascot.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { login, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setVerificationError(null);

    try {
      const user = await login(email, password);
      toast.success('أهلًا بعودتك!');
      
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'staff') {
          navigate('/staff', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      }, 100);
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'فشل تسجيل الدخول - تحقق من بيانات الدخول';
      
      // Handle email verification required (403)
      if (status === 403) {
        setVerificationError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      console.error('Login error:', status, errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const handleResendVerification = async () => {
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني أولاً');
      return;
    }

    setResendLoading(true);
    try {
      const response = await resendVerificationEmail(email);
      toast.success(response?.data?.message || 'تم إرسال رسالة التفعيل');
    } catch (error) {
      toast.error(error.response?.data?.error || 'تعذر إعادة إرسال رسالة التفعيل');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4" dir="rtl">
      <Card className="auth-card-premium w-full max-w-md">
        <CardHeader className="text-center pb-2">
          {/* Mascot with yellow badge */}
          <div className="flex justify-center mb-4">
            <div className="auth-mascot-badge">
              <img src={mascotImg} alt="بيكابو" className="auth-mascot-img" />
            </div>
          </div>
          <CardTitle className="font-heading text-3xl text-[var(--text-primary)]" data-testid="login-title">أهلًا بعودتك!</CardTitle>
          <p className="auth-slogan">بيكابو يصنع السعادة ✨</p>
          <CardDescription className="text-base mt-2">
            سجّل دخولك إلى حساب بيكابو
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Email verification warning */}
          {verificationError && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium text-sm">{verificationError}</p>
                <p className="text-yellow-700 text-xs mt-1">تحقق من بريدك الوارد أو الرسائل غير المرغوب فيها.</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="p-0 h-auto mt-2 text-yellow-800 font-semibold"
                >
                  {resendLoading ? 'جاري إعادة الإرسال...' : 'إعادة إرسال رابط التفعيل'}
                </Button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl h-12"
                  required
                  data-testid="login-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                  data-testid="forgot-password-link"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-xl h-12"
                  required
                  data-testid="login-password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full h-12 text-lg btn-playful"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline" data-testid="register-link">
                أنشئ حسابًا
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
