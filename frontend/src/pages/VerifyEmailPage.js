import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const { api } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('الرابط غير صالح');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'تم تفعيل حسابك بنجاح');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'الرابط غير صالح أو منتهي');
      }
    };

    verifyEmail();
  }, [searchParams, api]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4" dir="rtl">
      <Card className="auth-card-premium w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <h2 className="font-heading text-2xl text-[var(--text-primary)] mb-4">جاري التحقق...</h2>
              <p className="text-muted-foreground">يرجى الانتظار</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="font-heading text-2xl text-[var(--text-primary)] mb-4">تم تفعيل حسابك بنجاح ✅</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link to="/login">
                <Button className="rounded-full btn-playful">
                  تسجيل الدخول
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h2 className="font-heading text-2xl text-[var(--text-primary)] mb-4">فشل التحقق</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link to="/register">
                <Button className="rounded-full btn-playful">
                  إعادة إنشاء حساب
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
