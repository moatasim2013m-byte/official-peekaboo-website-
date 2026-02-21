import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PaymentPendingPage() {
  const navigate = useNavigate();
  useSearchParams();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-6xl" aria-hidden="true">
            ⏳
          </div>

          <h1 className="font-heading text-3xl font-bold text-yellow-600">الدفع قيد المراجعة</h1>
          <p className="text-lg text-yellow-600">Your payment is under review</p>

          <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful">
            الذهاب إلى الطلبات / Go to Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
