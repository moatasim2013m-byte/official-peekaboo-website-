import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    if (password.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success('تم إعادة تعيين كلمة المرور بنجاح!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'فشل إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
        <Card className="w-full max-w-md border-2 rounded-3xl shadow-xl">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">رابط إعادة التعيين غير صالح أو مفقود</p>
            <Link to="/forgot-password">
              <Button className="rounded-full">طلب رابط جديد</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-md border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">{success ? '✅' : '🔐'}</span>
          </div>
          <CardTitle className="font-heading text-3xl" data-testid="reset-title">
            {success ? 'تم إعادة التعيين!' : 'إعادة تعيين كلمة المرور'}
          </CardTitle>
          <CardDescription className="text-base">
            {success 
              ? 'تم تحديث كلمة المرور بنجاح'
              : 'أدخل كلمة المرور الجديدة أدناه'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-muted-foreground">جاري التحويل إلى صفحة الدخول...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="6 أحرف على الأقل"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 rounded-xl h-12"
                    required
                    data-testid="reset-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="أعد إدخال كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 rounded-xl h-12"
                    required
                    data-testid="reset-confirm-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-full h-12 text-lg btn-playful"
                disabled={loading}
                data-testid="reset-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري إعادة التعيين...
                  </>
                ) : (
                  'إعادة تعيين كلمة المرور'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
