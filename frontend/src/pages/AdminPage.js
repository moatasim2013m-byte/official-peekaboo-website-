import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  LayoutDashboard, Users, Clock, Cake, Star, Settings, Image, 
  Plus, Edit, Trash2, Loader2, Gift, Calendar, DollarSign
} from 'lucide-react';

export default function AdminPage() {
  const { api, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState(null); // 'today', 'active', 'custom_pending'
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [hourlyBookings, setHourlyBookings] = useState([]);
  const [birthdayBookings, setBirthdayBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [themes, setThemes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [settings, setSettings] = useState({});
  const [pricing, setPricing] = useState({
    hourly_1hr: 7,
    hourly_2hr: 10,
    hourly_3hr: 13,
    hourly_extra_hr: 3
  });

  // Dialog states
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [adjustPointsDialogOpen, setAdjustPointsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newTheme, setNewTheme] = useState({ name: '', description: '', price: '', image_url: '' });
  const [newPlan, setNewPlan] = useState({ name: '', description: '', visits: '', price: '' });
  const [newMedia, setNewMedia] = useState({ url: '', type: 'photo', title: '' });
  const [pointsAdjustment, setPointsAdjustment] = useState({ points: 0, description: '' });

  useEffect(() => {
    setLoading(false);
  }, []);

  // Show 403 page if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full border-2 rounded-3xl shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-4xl">🚫</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">403 - Not Authorized</CardTitle>
            <CardDescription className="text-base mt-2">
              You do not have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
              <p className="font-semibold mb-2">Debug Info:</p>
              <p>Email: {user?.email || 'Not logged in'}</p>
              <p>Role: <span className="font-bold text-red-600">{user?.role || 'None'}</span></p>
              <p className="mt-2 text-xs text-muted-foreground">
                Required role: <span className="font-bold">admin</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1 rounded-full">
                Go Home
              </Button>
              <Button onClick={() => navigate('/profile')} className="flex-1 rounded-full">
                My Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
    }
  }, [isAdmin]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, themesRes, plansRes, galleryRes, settingsRes, pricingRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/themes'),
        api.get('/admin/plans'),
        api.get('/gallery'),
        api.get('/admin/settings'),
        api.get('/admin/pricing')
      ]);

      setStats(dashRes.data.stats || {});
      setThemes(themesRes.data.themes || []);
      setPlans(plansRes.data.plans || []);
      setGallery(galleryRes.data.media || []);
      setSettings(settingsRes.data.settings || {});
      setPricing(pricingRes.data.pricing || {});
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?role=parent');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchHourlyBookings = async () => {
    try {
      const response = await api.get('/admin/bookings/hourly');
      setHourlyBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch hourly bookings:', error);
    }
  };

  const fetchBirthdayBookings = async () => {
    try {
      const response = await api.get('/admin/bookings/birthday');
      setBirthdayBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch birthday bookings:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/admin/subscriptions');
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveFilter(null); // Reset filter when manually changing tabs
    if (tab === 'users') fetchUsers();
    if (tab === 'hourly') fetchHourlyBookings();
    if (tab === 'birthday') fetchBirthdayBookings();
    if (tab === 'subscriptions') fetchSubscriptions();
  };

  // Dashboard card click handlers
  const handleDashboardCardClick = (tab, filter = null) => {
    setActiveTab(tab);
    setActiveFilter(filter);
    if (tab === 'users') fetchUsers();
    if (tab === 'hourly') fetchHourlyBookings();
    if (tab === 'birthday') fetchBirthdayBookings();
    if (tab === 'subscriptions') fetchSubscriptions();
  };

  // Filter helpers
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getFilteredHourlyBookings = () => {
    if (activeFilter === 'today') {
      return hourlyBookings.filter(b => isToday(b.booking_date || b.created_at));
    }
    return hourlyBookings;
  };

  const getFilteredBirthdayBookings = () => {
    if (activeFilter === 'today') {
      return birthdayBookings.filter(b => isToday(b.party_date || b.created_at));
    }
    if (activeFilter === 'custom_pending') {
      return birthdayBookings.filter(b => b.is_custom && b.status === 'custom_pending');
    }
    return birthdayBookings;
  };

  const getFilteredSubscriptions = () => {
    if (activeFilter === 'active') {
      return subscriptions.filter(s => s.status === 'active' && s.remaining_visits > 0);
    }
    return subscriptions;
  };

  const handleCreateTheme = async (e) => {
    e.preventDefault();
    try {
      await api.post('/themes', {
        ...newTheme,
        price: parseFloat(newTheme.price)
      });
      toast.success('Theme created!');
      setThemeDialogOpen(false);
      setNewTheme({ name: '', description: '', price: '', image_url: '' });
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to create theme');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/plans', {
        ...newPlan,
        visits: parseInt(newPlan.visits),
        price: parseFloat(newPlan.price)
      });
      toast.success('Plan created!');
      setPlanDialogOpen(false);
      setNewPlan({ name: '', description: '', visits: '', price: '' });
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to create plan');
    }
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gallery', newMedia);
      toast.success('Media added!');
      setMediaDialogOpen(false);
      setNewMedia({ url: '', type: 'photo', title: '' });
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to add media');
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!window.confirm('Delete this media?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      toast.success('Media deleted');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loyalty/adjust', {
        user_id: selectedUser.id,
        points: parseInt(pointsAdjustment.points),
        description: pointsAdjustment.description
      });
      toast.success('Points adjusted!');
      setAdjustPointsDialogOpen(false);
      setPointsAdjustment({ points: 0, description: '' });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to adjust points');
    }
  };

  const handleUpdateSettings = async (key, value) => {
    try {
      await api.put('/admin/settings', { [key]: value });
      setSettings({ ...settings, [key]: value });
      toast.success('Setting updated');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const handleUpdatePricing = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/pricing', pricing);
      toast.success('تم تحديث الأسعار بنجاح / Pricing updated successfully!');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to update pricing');
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
      expired: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold" data-testid="admin-title">
            <LayoutDashboard className="inline-block h-8 w-8 text-primary mr-2" />
            Admin Panel
          </h1>
          <Button onClick={() => navigate('/reception')} className="rounded-full gap-2">
            Reception Scanner
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-white border rounded-full p-1 flex-wrap">
            <TabsTrigger value="dashboard" className="rounded-full gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-full gap-2">
              <DollarSign className="h-4 w-4" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full gap-2">
              <Users className="h-4 w-4" /> Parents
            </TabsTrigger>
            <TabsTrigger value="hourly" className="rounded-full gap-2">
              <Clock className="h-4 w-4" /> Hourly
            </TabsTrigger>
            <TabsTrigger value="birthday" className="rounded-full gap-2">
              <Cake className="h-4 w-4" /> Birthday
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-full gap-2">
              <Star className="h-4 w-4" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="themes" className="rounded-full gap-2">
              <Cake className="h-4 w-4" /> Themes
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-full gap-2">
              <Image className="h-4 w-4" /> Gallery
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleDashboardCardClick('users')}>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_parents || 0}</p>
                  <p className="text-sm text-muted-foreground">Parents</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleDashboardCardClick('users')}>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_children || 0}</p>
                  <p className="text-sm text-muted-foreground">Children</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleDashboardCardClick('hourly', 'today')}>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.today_hourly_bookings || 0}</p>
                  <p className="text-sm text-muted-foreground">Today Hourly</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleDashboardCardClick('birthday', 'today')}>
                <CardContent className="p-4 text-center">
                  <Cake className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.today_birthday_bookings || 0}</p>
                  <p className="text-sm text-muted-foreground">Today Birthday</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleDashboardCardClick('subscriptions', 'active')}>
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.active_subscriptions || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Subs</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => handleDashboardCardClick('birthday', 'custom_pending')}>
                <CardContent className="p-4 text-center">
                  <Cake className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.pending_custom_parties || 0}</p>
                  <p className="text-sm text-muted-foreground">Custom Pending</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pricing Management */}
          <TabsContent value="pricing">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">إدارة الأسعار / Pricing Management</CardTitle>
                <CardDescription>
                  تحكم كامل في أسعار التذاكر، الاشتراكات، وثيمات الحفلات
                  <br />
                  Full control over hourly tickets, subscriptions, and birthday theme prices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Hourly Pricing */}
                <div>
                  <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    أسعار التذاكر بالساعة / Hourly Ticket Pricing
                  </h3>
                  <form onSubmit={handleUpdatePricing} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="hourly_1hr">ساعة واحدة / 1 Hour (JD)</Label>
                        <Input
                          id="hourly_1hr"
                          type="number"
                          step="0.01"
                          value={pricing.hourly_1hr}
                          onChange={(e) => setPricing({ ...pricing, hourly_1hr: parseFloat(e.target.value) })}
                          className="rounded-xl mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hourly_2hr">ساعتان / 2 Hours (JD) ⭐</Label>
                        <Input
                          id="hourly_2hr"
                          type="number"
                          step="0.01"
                          value={pricing.hourly_2hr}
                          onChange={(e) => setPricing({ ...pricing, hourly_2hr: parseFloat(e.target.value) })}
                          className="rounded-xl mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hourly_3hr">3 ساعات / 3 Hours (JD)</Label>
                        <Input
                          id="hourly_3hr"
                          type="number"
                          step="0.01"
                          value={pricing.hourly_3hr}
                          onChange={(e) => setPricing({ ...pricing, hourly_3hr: parseFloat(e.target.value) })}
                          className="rounded-xl mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hourly_extra_hr">ساعة إضافية / Extra Hour (JD)</Label>
                        <Input
                          id="hourly_extra_hr"
                          type="number"
                          step="0.01"
                          value={pricing.hourly_extra_hr}
                          onChange={(e) => setPricing({ ...pricing, hourly_extra_hr: parseFloat(e.target.value) })}
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="rounded-full px-8">
                      حفظ الأسعار / Save Pricing
                    </Button>
                  </form>
                </div>

                {/* Subscription Plans */}
                <div>
                  <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-secondary" />
                    باقات الاشتراكات / Subscription Plans
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <Card key={plan.id} className="rounded-xl">
                        <CardContent className="p-4">
                          <h4 className="font-heading font-bold text-lg">{plan.name_ar || plan.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{plan.description_ar || plan.description}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{plan.visits} زيارة / visits</Badge>
                            <span className="font-bold text-primary text-lg">{plan.price} دينار</span>
                          </div>
                          {plan.is_daily_pass && (
                            <Badge className="mt-2 bg-purple-100 text-purple-700">
                              باقة يومية / Daily Pass
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    يمكن تعديل الباقات من تبويب "Subscriptions"
                    <br />
                    Edit subscription plans in the "Subscriptions" tab
                  </p>
                </div>

                {/* Birthday Themes */}
                <div>
                  <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <Cake className="h-5 w-5 text-pink-500" />
                    ثيمات حفلات الأعياد / Birthday Themes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themes.slice(0, 6).map((theme) => (
                      <Card key={theme.id} className="rounded-xl">
                        <CardContent className="p-4">
                          <h4 className="font-heading font-bold">{theme.name_ar || theme.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{theme.description_ar || theme.description}</p>
                          <p className="text-primary font-bold mt-2">{theme.price} دينار / JD</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    يمكن تعديل الثيمات وأسعارها من تبويب "Themes"
                    <br />
                    Edit themes and prices in the "Themes" tab
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users/Parents */}
          <TabsContent value="users">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Parents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-secondary">{user.loyalty_points} pts</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full"
                          onClick={() => {
                            setSelectedUser(user);
                            setAdjustPointsDialogOpen(true);
                          }}
                        >
                          <Gift className="h-4 w-4 mr-1" /> Adjust
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hourly Bookings */}
          <TabsContent value="hourly">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Hourly Bookings {activeFilter === 'today' && <Badge className="ml-2 bg-blue-500">Today</Badge>}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getFilteredHourlyBookings().map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{booking.booking_code}</span>
                          <Badge className={getStatusBadge(booking.status)}>{booking.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.slot?.date} at {booking.slot?.start_time} - {booking.child?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.user?.email}</p>
                      </div>
                      <p className="font-bold">${booking.amount}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Birthday Bookings */}
          <TabsContent value="birthday">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Birthday Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {birthdayBookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{booking.booking_code}</span>
                          <Badge className={getStatusBadge(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.slot?.date} - {booking.is_custom ? 'Custom Theme' : booking.theme?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.user?.email}</p>
                        {booking.is_custom && (
                          <p className="text-sm text-purple-600 mt-1">Request: {booking.custom_request}</p>
                        )}
                      </div>
                      <p className="font-bold">{booking.amount ? `$${booking.amount}` : 'Pending'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions */}
          <TabsContent value="subscriptions">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subscription Plans</CardTitle>
                <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" /> Add Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Subscription Plan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePlan} className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={newPlan.description} onChange={(e) => setNewPlan({...newPlan, description: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Visits</Label>
                          <Input type="number" value={newPlan.visits} onChange={(e) => setNewPlan({...newPlan, visits: e.target.value})} className="rounded-xl mt-1" />
                        </div>
                        <div>
                          <Label>Price ($)</Label>
                          <Input type="number" step="0.01" value={newPlan.price} onChange={(e) => setNewPlan({...newPlan, price: e.target.value})} className="rounded-xl mt-1" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full rounded-full">Create Plan</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="rounded-xl">
                      <CardContent className="p-4">
                        <h3 className="font-heading font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="mt-2 flex justify-between">
                          <span className="text-secondary font-bold">{plan.visits} visits</span>
                          <span className="font-bold">${plan.price}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <h3 className="font-heading font-bold mb-4">Active Subscriptions</h3>
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sub.plan?.name}</span>
                          <Badge className={getStatusBadge(sub.status)}>{sub.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{sub.user?.email} - {sub.child?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary">{sub.remaining_visits} left</p>
                        <p className="text-sm text-muted-foreground">
                          Expires {format(new Date(sub.expires_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Themes */}
          <TabsContent value="themes">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Birthday Themes</CardTitle>
                <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" /> Add Theme
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Theme</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTheme} className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={newTheme.name} onChange={(e) => setNewTheme({...newTheme, name: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={newTheme.description} onChange={(e) => setNewTheme({...newTheme, description: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <div>
                        <Label>Price ($)</Label>
                        <Input type="number" step="0.01" value={newTheme.price} onChange={(e) => setNewTheme({...newTheme, price: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <div>
                        <Label>Image URL</Label>
                        <Input value={newTheme.image_url} onChange={(e) => setNewTheme({...newTheme, image_url: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <Button type="submit" className="w-full rounded-full">Create Theme</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <Card key={theme.id} className="rounded-xl overflow-hidden">
                      {theme.image_url && (
                        <img src={theme.image_url} alt={theme.name} className="w-full h-32 object-cover" />
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-heading font-bold">{theme.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{theme.description}</p>
                        <p className="text-accent font-bold mt-2">${theme.price}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Homepage Gallery</CardTitle>
                <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" /> Add Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Gallery Media</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMedia} className="space-y-4">
                      <div>
                        <Label>URL</Label>
                        <Input value={newMedia.url} onChange={(e) => setNewMedia({...newMedia, url: e.target.value})} className="rounded-xl mt-1" placeholder="https://..." />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={newMedia.type} onValueChange={(v) => setNewMedia({...newMedia, type: v})}>
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photo">Photo</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Title (Optional)</Label>
                        <Input value={newMedia.title} onChange={(e) => setNewMedia({...newMedia, title: e.target.value})} className="rounded-xl mt-1" />
                      </div>
                      <Button type="submit" className="w-full rounded-full">Add Media</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <div key={item.id} className="relative rounded-xl overflow-hidden group">
                      {item.type === 'photo' ? (
                        <img src={item.url} alt={item.title} className="w-full h-32 object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-32 object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteMedia(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Pricing & Capacity Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Hourly Ticket Price ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      defaultValue={settings.hourly_price || 10}
                      onBlur={(e) => handleUpdateSettings('hourly_price', parseFloat(e.target.value))}
                      className="rounded-xl mt-2"
                    />
                  </div>
                  <div>
                    <Label>Default Slot Capacity</Label>
                    <Input 
                      type="number"
                      defaultValue={settings.hourly_capacity || 25}
                      onBlur={(e) => handleUpdateSettings('hourly_capacity', parseInt(e.target.value))}
                      className="rounded-xl mt-2"
                    />
                  </div>
                  <div>
                    <Label>Birthday Slot Capacity</Label>
                    <Input 
                      type="number"
                      defaultValue={settings.birthday_capacity || 1}
                      onBlur={(e) => handleUpdateSettings('birthday_capacity', parseInt(e.target.value))}
                      className="rounded-xl mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Adjust Points Dialog */}
        <Dialog open={adjustPointsDialogOpen} onOpenChange={setAdjustPointsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Loyalty Points</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <form onSubmit={handleAdjustPoints} className="space-y-4">
                <p>Adjusting points for: <strong>{selectedUser.name}</strong></p>
                <p>Current balance: <strong>{selectedUser.loyalty_points} points</strong></p>
                <div>
                  <Label>Points (use negative to deduct)</Label>
                  <Input 
                    type="number"
                    value={pointsAdjustment.points}
                    onChange={(e) => setPointsAdjustment({...pointsAdjustment, points: e.target.value})}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea 
                    value={pointsAdjustment.description}
                    onChange={(e) => setPointsAdjustment({...pointsAdjustment, description: e.target.value})}
                    className="rounded-xl mt-1"
                    placeholder="Reason for adjustment..."
                  />
                </div>
                <Button type="submit" className="w-full rounded-full">Adjust Points</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
