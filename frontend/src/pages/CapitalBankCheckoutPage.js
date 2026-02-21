import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function CapitalBankCheckoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      navigate('/payment/failed?reason=invalid_session', { replace: true });
      return;
    }

    window.location.assign(`/api/payments/capital-bank/secure-acceptance/form/${encodeURIComponent(sessionId)}`);
  }, [navigate, sessionId]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">جاري تحويلك لصفحة الدفع الآمنة</CardTitle>
          <CardDescription>Redirecting to CyberSource Secure Acceptance...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}
