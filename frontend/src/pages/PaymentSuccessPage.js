import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('id');

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-4">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="font-heading text-3xl font-bold text-green-700">تم قبول الدفع بنجاح</h1>
          <p className="text-lg text-green-700">Your payment was accepted</p>

          <div className="bg-green-50 border border-green-200 rounded-xl py-3 px-4">
            <p className="text-sm text-muted-foreground">رقم الطلب / Order ID</p>
            <p className="font-semibold text-base">{orderId || '—'}</p>
          </div>

          <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful">
            الذهاب إلى الطلبات / Go to Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
