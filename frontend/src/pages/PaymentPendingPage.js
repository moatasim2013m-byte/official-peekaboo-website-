import { useNavigate } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PaymentPendingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-4">
          <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Clock3 className="h-12 w-12 text-yellow-600" />
          </div>

          <h1 className="font-heading text-3xl font-bold text-yellow-700">الدفع قيد المراجعة</h1>
          <p className="text-lg text-yellow-700">Your payment is under review</p>

          <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful">
            الذهاب إلى الطلبات / Go to Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
