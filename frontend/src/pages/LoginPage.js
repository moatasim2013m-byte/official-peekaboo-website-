import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';
import mascotImg from '../assets/mascot.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success('أهلًا بعودتك!');
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
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
