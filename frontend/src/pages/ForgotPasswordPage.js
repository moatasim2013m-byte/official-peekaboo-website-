import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('الرجاء إدخال البريد الإلكتروني');
      return;
    }

    console.log('FORGOT_UI_SUBMIT', email);

    setLoading(true);

    try {
      await forgotPassword(email);
      console.log('FORGOT_UI_RESPONSE', 200);
      setSuccess(true);
      toast.success('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');
    } catch (error) {
      console.log('FORGOT_UI_RESPONSE', error.response?.status || 'ERROR');
      toast.error(error.response?.data?.error || 'فشل في إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4">
      <Card className="w-full max-w-md border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">{success ? '✅' : '🔑'}</span>
          </div>
          <CardTitle className="font-heading text-3xl">
            {success ? 'تم الإرسال!' : 'نسيت كلمة المرور؟'}
          </CardTitle>
          <CardDescription className="text-base">
            {success 
              ? 'تحقق من بريدك الإلكتروني'
              : 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. الرجاء التحقق من الوارد أو الرسائل غير المرغوب فيها.
                </p>
                <Link to="/login">
                  <Button className="w-full rounded-full h-12 text-lg btn-playful">
                    العودة لتسجيل الدخول
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال رابط إعادة التعيين'
                )}
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-primary hover:underline"
                >
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
