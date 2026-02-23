import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

export default function CapitalBankCheckoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { api, isAuthenticated, loading } = useAuth();
  const orderId = useMemo(() => sessionId || '', [sessionId]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!orderId || isLoading) {
      navigate('/payment/failed?reason=invalid_session', { replace: true });
      return;
    }

    setIsLoading(true);
    const payload = {
      orderId,
      originUrl: window.location.origin
    };

    try {
      const response = await api.post('/payments/capital-bank/initiate', payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response?.data || {};
      const secureAcceptance = result?.secureAcceptance;
      if (result?.success && secureAcceptance?.url && secureAcceptance?.fields) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = secureAcceptance.url;

        Object.entries(secureAcceptance.fields).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = `${value ?? ''}`;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      const reason = encodeURIComponent(result?.reason || result?.error || 'payment_declined');
      navigate(`/payment/failed?reason=${reason}`, { replace: true });
    } catch (error) {
      const reason = encodeURIComponent(error?.response?.data?.reason || error?.response?.data?.error || 'network_error');
      navigate(`/payment/failed?reason=${reason}`, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">الدفع عبر البطاقة</CardTitle>
          <CardDescription>سيتم تحويلك إلى صفحة الدفع الآمنة التابعة للبنك لإتمام العملية.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <p className="text-right text-sm text-slate-600">
              للحماية القصوى، لن يتم إدخال بيانات البطاقة داخل منصة Peekaboo، وسيتم إكمال الدفع مباشرة عبر بوابة البنك (Secure Acceptance).
            </p>

            <button
              type="submit"
              className="w-full rounded-xl p-3 bg-pink-600 text-white font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحويل إلى الدفع الآمن...</> : 'المتابعة إلى الدفع الآمن'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
