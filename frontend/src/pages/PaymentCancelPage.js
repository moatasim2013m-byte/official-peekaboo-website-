import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4">
      <Card className="w-full max-w-md border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center">
          <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-yellow-600" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Payment Cancelled</h2>
          <p className="text-muted-foreground mb-6">
            Your payment was cancelled. No charges were made.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/tickets')} variant="outline" className="rounded-full">
              Try Again
            </Button>
            <Button onClick={() => navigate('/')} className="rounded-full btn-playful">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
