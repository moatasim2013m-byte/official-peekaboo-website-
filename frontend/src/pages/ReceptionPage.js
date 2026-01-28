import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, User, Clock, ShieldCheck } from 'lucide-react';
import mascotImg from '../assets/mascot.png';

export default function ReceptionPage() {
  const { api } = useAuth();
  const [search, setSearch] = useState('');
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/staff/parent-lookup?q=${encodeURIComponent(search)}`);
      setParent(res.data);
    } catch (error) {
      toast.error('لم يتم العثور على ولي الأمر');
      setParent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (childId) => {
    try {
      await api.post('/staff/redeem-visit', { child_id: childId });
      toast.success('تم بدء الجلسة');
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'فشلت العملية');
    }
  };

  const handleEnd = async (sessionId) => {
    try {
      await api.post('/staff/end-session', { session_id: sessionId });
      toast.success('تم إنهاء الجلسة');
      handleSearch();
    } catch (error) {
      toast.error('فشل إنهاء الجلسة');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Staff Badge Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={mascotImg} alt="" className="h-12 w-12 rounded-full border-2 border-[var(--peekaboo-green)] shadow" />
            <h1 className="text-3xl font-bold">الاستقبال</h1>
          </div>
          <Badge className="bg-[var(--peekaboo-green)] text-white px-4 py-2 text-sm">
            <ShieldCheck className="h-4 w-4 ml-2" />
            وضع الموظف – الاستقبال
          </Badge>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="البريد الإلكتروني أو رقم الهاتف"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-right"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 ml-1" />
                بحث
              </Button>
            </div>
          </CardContent>
        </Card>

        {parent && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {parent.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>البريد: {parent.email}</p>
                <p>الاشتراك: {parent.subscription?.remaining_visits || 0} زيارات متبقية</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {parent.children?.map(child => (
                <Card key={child.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{child.name}</p>
                        {child.active_session ? (
                          <Badge className="mt-2 bg-blue-500">
                            <Clock className="h-3 w-3 ml-1" />
                            نشط ({new Date(child.active_session.end_time).toLocaleTimeString('ar-EG')})
                          </Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">لا توجد جلسة نشطة</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {child.active_session ? (
                          <Button variant="destructive" onClick={() => handleEnd(child.active_session.id)}>
                            إنهاء
                          </Button>
                        ) : (
                          <Button onClick={() => handleRedeem(child.id)} disabled={!parent.subscription?.remaining_visits}>
                            بدء (ساعة)
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
