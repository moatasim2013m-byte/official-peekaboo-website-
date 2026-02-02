import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  User, Baby, Clock, Cake, Star, Gift, Plus, Edit, Trash2, 
  QrCode, AlertTriangle, Calendar, Loader2, Phone, Settings
} from 'lucide-react';

export default function ProfilePage() {
  const { user, api, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [hourlyBookings, setHourlyBookings] = useState([]);
  const [birthdayBookings, setBirthdayBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthday, setNewChildBirthday] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Defense in depth: Redirect admin users
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  // Initialize phone from user
  useEffect(() => {
    if (user?.phone) {
      setEditPhone(user.phone);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, hourlyRes, birthdayRes, subsRes, loyaltyRes, activeRes] = await Promise.all([
        api.get('/profile'),
        api.get('/bookings/hourly'),
        api.get('/bookings/birthday'),
        api.get('/subscriptions/my'),
        api.get('/loyalty'),
        api.get('/bookings/hourly/active')
      ]);

      setChildren(profileRes.data.children || []);
      setHourlyBookings(hourlyRes.data.bookings || []);
      setBirthdayBookings(birthdayRes.data.bookings || []);
      setSubscriptions(subsRes.data.subscriptions || []);
      setLoyaltyHistory(loyaltyRes.data.history || []);
      setActiveSession(activeRes.data.active_session);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for active session updates
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get('/bookings/hourly/active');
        setActiveSession(response.data.active_session);
      } catch (error) {
        console.error('Failed to poll active session:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [activeSession, api]);

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildName.trim()) {
      toast.error('الرجاء إدخال اسم الطفل');
      return;
    }

    try {
      await api.post('/profile/children', {
        name: newChildName.trim(),
        birthday: newChildBirthday || null
      });
      toast.success('تمت إضافة الطفل بنجاح');
      setNewChildName('');
      setNewChildBirthday('');
      setAddChildOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'فشل إضافة الطفل');
    }
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطفل؟')) return;

    try {
      await api.delete(`/profile/children/${childId}`);
      toast.success('تم حذف الطفل');
      fetchData();
    } catch (error) {
      toast.error('فشل حذف الطفل');
    }
  };

  const handleSavePhone = async () => {
    const cleaned = editPhone.replace(/\s/g, '');
    if (cleaned && !/^07\d{8}$/.test(cleaned)) {
      toast.error('رقم الهاتف غير صالح (07XXXXXXXX)');
      return;
    }
    
    setSavingPhone(true);
    try {
      await api.put('/profile', { phone: cleaned });
      toast.success('تم حفظ رقم الهاتف');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error('فشل حفظ رقم الهاتف');
    } finally {
      setSavingPhone(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      checked_in: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      custom_pending: 'bg-purple-100 text-purple-700',
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      consumed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-yellow-100 text-yellow-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-4xl font-bold text-foreground" data-testid="profile-title">
              مرحباً، {user?.name || ''}
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
            {user?.phone && (
              <p className="text-muted-foreground ltr-text">{user.phone}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-secondary/10 px-4 py-2 rounded-full flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary" />
              <span className="font-bold text-secondary">{user?.loyalty_points || 0} نقطة</span>
            </div>
          </div>
        </div>

        {/* Active Session Alert */}
        {activeSession && (
          <Card className="border-2 border-primary bg-primary/5 rounded-3xl mb-8">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${activeSession.warning_5min ? 'bg-destructive timer-warning' : 'bg-primary'}`}>
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg">جلسة لعب نشطة</h3>
                    <p className="text-muted-foreground">
                      {activeSession.child_id?.name || 'الطفل'} يلعب الآن!
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-heading font-bold ${activeSession.warning_5min ? 'text-destructive' : 'text-primary'}`}>
                    {activeSession.remaining_minutes} دقيقة
                  </div>
                  <p className="text-sm text-muted-foreground">متبقية</p>
                  {activeSession.warning_5min && (
                    <div className="flex items-center gap-1 text-destructive mt-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">الجلسة تنتهي قريباً!</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="children" className="space-y-6">
          <TabsList className="bg-white border-2 border-border rounded-full p-1 flex-wrap">
            <TabsTrigger value="children" className="rounded-full gap-2" data-testid="tab-children">
              <Baby className="h-4 w-4" /> أطفالي
            </TabsTrigger>
            <TabsTrigger value="hourly" className="rounded-full gap-2" data-testid="tab-hourly">
              <Clock className="h-4 w-4" /> بالساعة
            </TabsTrigger>
            <TabsTrigger value="birthday" className="rounded-full gap-2" data-testid="tab-birthday">
              <Cake className="h-4 w-4" /> أعياد الميلاد
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-full gap-2" data-testid="tab-subscriptions">
              <Star className="h-4 w-4" /> الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-full gap-2" data-testid="tab-loyalty">
              <Gift className="h-4 w-4" /> نقاط الولاء
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" /> الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children">
            <Card className="border-2 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading">أطفالي</CardTitle>
                  <CardDescription>إدارة ملفات أطفالك</CardDescription>
                </div>
                <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2" data-testid="add-child-btn">
                      <Plus className="h-4 w-4" /> إضافة طفل
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-heading">إضافة طفل</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddChild} className="space-y-4">
                      <div>
                        <Label htmlFor="childName">الاسم</Label>
                        <Input
                          id="childName"
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                          className="rounded-xl mt-2"
                          placeholder="اسم الطفل"
                          data-testid="child-name-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="childBirthday">تاريخ الميلاد</Label>
                        <Input
                          id="childBirthday"
                          type="date"
                          value={newChildBirthday}
                          onChange={(e) => setNewChildBirthday(e.target.value)}
                          className="rounded-xl mt-2"
                          data-testid="child-birthday-input"
                        />
                      </div>
                      <Button type="submit" className="w-full rounded-full" data-testid="save-child-btn">
                        إضافة طفل
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم إضافة أطفال بعد</p>
                    <p className="text-sm mt-2">أضف طفلك الأول لبدء الحجز</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                      <Card key={child.id} className="border rounded-2xl" data-testid={`child-card-${child.id}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-3 rounded-full">
                              <Baby className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{child.name}</p>
                              <p className="text-sm text-muted-foreground">
                                تاريخ الميلاد: {format(new Date(child.birthday), 'yyyy/MM/dd')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteChild(child.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hourly Bookings Tab */}
          <TabsContent value="hourly">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading">حجوزات اللعب بالساعة</CardTitle>
                <CardDescription>سجل جلسات اللعب الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlyBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد حجوزات بعد</p>
                    <Button onClick={() => navigate('/tickets')} className="rounded-full mt-4">
                      احجز جلسة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hourlyBookings.map((booking) => (
                      <Card key={booking.id} className="border rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-start gap-4">
                              {booking.status === 'confirmed' && booking.qr_code && (
                                <div className="qr-container hidden md:block">
                                  <img src={booking.qr_code} alt="رمز QR" className="w-20 h-20" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{booking.booking_code}</span>
                                  <Badge className={getStatusBadge(booking.status)}>
                                    {booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'checked_in' ? 'مسجل الدخول' : booking.status === 'completed' ? 'مكتمل' : booking.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {booking.slot_id?.date} الساعة {booking.slot_id?.start_time}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  الطفل: {booking.child_id?.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold">{booking.amount} دينار</p>
                              {booking.status === 'confirmed' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-full mt-2 md:hidden">
                                      <QrCode className="h-4 w-4 ml-1" /> عرض QR
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>رمز QR للحجز</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex justify-center">
                                      <img src={booking.qr_code} alt="رمز QR" className="w-48 h-48" />
                                    </div>
                                    <p className="text-center text-muted-foreground">
                                      اعرض هذا الرمز في الاستقبال لتسجيل الدخول
                                    </p>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Birthday Bookings Tab */}
          <TabsContent value="birthday">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading">حجوزات أعياد الميلاد</CardTitle>
                <CardDescription>حجوزات الحفلات الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                {birthdayBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Cake className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد حجوزات حفلات بعد</p>
                    <Button onClick={() => navigate('/birthday')} className="rounded-full mt-4 bg-accent">
                      احجز حفلة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {birthdayBookings.map((booking) => (
                      <Card key={booking.id} className="border rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{booking.booking_code}</span>
                                <Badge className={getStatusBadge(booking.status)}>
                                  {booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'custom_pending' ? 'قيد المراجعة' : booking.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {booking.slot_id?.date} الساعة {booking.slot_id?.start_time}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                الطفل: {booking.child_id?.name}
                              </p>
                              <p className="text-sm">
                                الثيم: {booking.is_custom ? 'طلب مخصص' : booking.theme_id?.name_ar || booking.theme_id?.name}
                              </p>
                            </div>
                            <div className="text-left">
                              {booking.amount && <p className="font-bold">{booking.amount} دينار</p>}
                              {booking.is_custom && (
                                <p className="text-sm text-muted-foreground">بانتظار التسعير</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading">سجل الاشتراكات</CardTitle>
                <CardDescription>باقات الاشتراك الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد اشتراكات بعد</p>
                    <Button onClick={() => navigate('/subscriptions')} className="rounded-full mt-4 bg-secondary text-secondary-foreground">
                      تصفح الباقات
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <Card key={sub.id} className={`border rounded-2xl ${sub.status === 'active' || sub.status === 'pending' ? 'border-secondary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{sub.plan_id?.name_ar || sub.plan_id?.name}</span>
                                <Badge className={getStatusBadge(sub.status)}>
                                  {sub.status === 'pending' ? 'غير مفعّل' : sub.status === 'active' ? 'نشط' : sub.status === 'expired' ? 'منتهي' : sub.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                الطفل: {sub.child_id?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {sub.status === 'pending' 
                                  ? 'ينتهي بعد 30 يوم من أول تسجيل دخول'
                                  : sub.expires_at 
                                    ? `ينتهي: ${format(new Date(sub.expires_at), 'yyyy/MM/dd')}`
                                    : 'لم يتم تحديد تاريخ انتهاء'
                                }
                              </p>
                            </div>
                            <div className="text-left">
                              <div className="text-2xl font-heading font-bold text-secondary">
                                {sub.remaining_visits}
                              </div>
                              <p className="text-sm text-muted-foreground">زيارة متبقية</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Gift className="h-6 w-6 text-secondary" />
                  برنامج الولاء
                </CardTitle>
                <CardDescription>
                  رصيدك: <span className="font-bold text-secondary">{user?.loyalty_points || 0} نقطة</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loyaltyHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد سجل نقاط بعد</p>
                    <p className="text-sm mt-2">اكسب 10 نقاط مع كل عملية شراء!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loyaltyHistory.map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entry.created_at), 'yyyy/MM/dd')}
                          </p>
                        </div>
                        <span className={`font-bold ${entry.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
