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
    <div className="min-h-screen bg-slate-100 p-6 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Staff Badge Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <img src={mascotImg} alt="" className="h-14 w-14 rounded-full border-3 border-[var(--peekaboo-green)] shadow-md" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">الاستقبال</h1>
              <p className="text-sm text-slate-500">هذا الوضع مخصص لموظفي الاستقبال فقط</p>
            </div>
          </div>
          <Badge className="bg-[var(--peekaboo-green)] text-white px-4 py-2.5 text-sm font-semibold" title="وضع تشغيلي للموظفين فقط">
            <ShieldCheck className="h-5 w-5 ml-2" />
            وضع الموظف
          </Badge>
        </div>
        
        <Card className="mb-6 shadow-md border-0">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="البريد الإلكتروني أو رقم الهاتف"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-right h-12 text-base rounded-xl border-2 border-slate-200 focus:border-[var(--peekaboo-green)]"
              />
              <Button onClick={handleSearch} disabled={loading} className="h-12 px-6 text-base font-semibold rounded-xl bg-[var(--peekaboo-green)] hover:bg-[var(--peekaboo-green)]/90">
                <Search className="h-5 w-5 ml-2" />
                بحث
              </Button>
            </div>
          </CardContent>
        </Card>

        {parent && (
          <>
            <Card className="mb-6 shadow-md border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-slate-100 rounded-full">
                    <User className="h-6 w-6 text-slate-600" />
                  </div>
                  {parent.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-1">البريد: {parent.email}</p>
                <div className="flex items-center gap-2 mt-3 p-3 bg-[var(--peekaboo-yellow)]/10 rounded-xl">
                  <span className="text-lg font-bold text-amber-700">{parent.subscription?.remaining_visits || 0}</span>
                  <span className="text-amber-700">زيارات متبقية</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {parent.children?.map(child => (
                <Card key={child.id} className="shadow-md border-0">
                  <CardContent className="py-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg text-slate-800">{child.name}</p>
                        {child.active_session ? (
                          <Badge className="mt-2 bg-blue-500 text-white px-3 py-1.5 text-sm">
                            <Clock className="h-4 w-4 ml-2" />
                            نشط ({new Date(child.active_session.end_time).toLocaleTimeString('ar-EG')})
                          </Badge>
                        ) : (
                          <p className="text-sm text-slate-500 mt-1">لا توجد جلسة نشطة</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {child.active_session ? (
                          <Button variant="destructive" onClick={() => handleEnd(child.active_session.id)} className="h-12 px-6 text-base font-semibold rounded-xl">
                            إنهاء الجلسة
                          </Button>
                        ) : (
                          <Button onClick={() => handleRedeem(child.id)} disabled={!parent.subscription?.remaining_visits} className="h-12 px-6 text-base font-semibold rounded-xl bg-[var(--peekaboo-green)] hover:bg-[var(--peekaboo-green)]/90">
                            بدء جلسة (ساعة)
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
