import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-6xl" aria-hidden="true">
            ✅
          </div>

          <h1 className="font-heading text-3xl font-bold text-green-600">تم قبول الدفع بنجاح</h1>
          <p className="text-lg text-green-600">Your payment was accepted</p>

          <div className="bg-green-50 border border-green-200 rounded-xl py-3 px-4">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-semibold text-base">{sessionId || '—'}</p>
          </div>

          <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful">
            الذهاب إلى الطلبات / Go to Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
