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
  Plus, Edit, Trash2, Loader2, Gift, Calendar, DollarSign, Home, Upload
} from 'lucide-react';
import mascotImg from '../assets/mascot.png';

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
  const [expandedParent, setExpandedParent] = useState(null);
  const [parentDetails, setParentDetails] = useState(null);
  const [loadingParent, setLoadingParent] = useState(false);

  // Hero settings state
  const [heroSettings, setHeroSettings] = useState({
    hero_title: 'حيث يلعب الأطفال ويحتفلون 🎈',
    hero_subtitle: 'أفضل تجربة ملعب داخلي! احجز جلسات اللعب، أقم حفلات أعياد ميلاد لا تُنسى، ووفّر مع باقات الاشتراك',
    hero_cta_text: 'احجز جلسة',
    hero_cta_route: '/tickets',
    hero_image: ''
  });
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [savingHero, setSavingHero] = useState(false);

  // Dialog states
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [adjustPointsDialogOpen, setAdjustPointsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingTheme, setEditingTheme] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState(null);

  // Form states
  const [newTheme, setNewTheme] = useState({ name: '', name_ar: '', description: '', description_ar: '', price: '', image_url: '' });
  const [newPlan, setNewPlan] = useState({ name: '', name_ar: '', description: '', description_ar: '', visits: '', price: '' });
  const [newMedia, setNewMedia] = useState({ url: '', type: 'photo', title: '', file: null });
  const [pointsAdjustment, setPointsAdjustment] = useState({ points: 0, description: '' });

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
    }
  }, [isAdmin]);

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
      
      // Load hero settings from settings
      const s = settingsRes.data.settings || {};
      if (s.hero_title || s.hero_subtitle || s.hero_image) {
        setHeroSettings({
          hero_title: s.hero_title || heroSettings.hero_title,
          hero_subtitle: s.hero_subtitle || heroSettings.hero_subtitle,
          hero_cta_text: s.hero_cta_text || heroSettings.hero_cta_text,
          hero_cta_route: s.hero_cta_route || heroSettings.hero_cta_route,
          hero_image: s.hero_image || ''
        });
      }
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
      if (editingTheme) {
        await api.put(`/admin/themes/${editingTheme.id}`, {
          ...newTheme,
          price: parseFloat(newTheme.price)
        });
        toast.success('Theme updated!');
        setEditingTheme(null);
      } else {
        await api.post('/admin/themes', {
          ...newTheme,
          price: parseFloat(newTheme.price)
        });
        toast.success('Theme created!');
      }
      setThemeDialogOpen(false);
      setNewTheme({ name: '', name_ar: '', description: '', description_ar: '', price: '', image_url: '' });
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to save theme');
    }
  };

  const handleEditTheme = (theme) => {
    setEditingTheme(theme);
    setNewTheme({
      name: theme.name || '',
      name_ar: theme.name_ar || '',
      description: theme.description || '',
      description_ar: theme.description_ar || '',
      price: theme.price?.toString() || '',
      image_url: theme.image_url || ''
    });
    setThemeDialogOpen(true);
  };

  const handleDeleteTheme = async (id) => {
    if (!window.confirm('Delete this theme?')) return;
    try {
      await api.delete(`/admin/themes/${id}`);
      toast.success('Theme deleted');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to delete theme');
    }
  };

  // Image upload handler
  const handleImageUpload = async (e, setter, field = 'image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('يجب أن تكون الصورة PNG أو JPG أو WebP');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 10MB');
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setter(prev => ({ ...prev, [field]: response.data.image_url }));
      toast.success('تم رفع الصورة');
    } catch (error) {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, {
          ...newPlan,
          visits: parseInt(newPlan.visits),
          price: parseFloat(newPlan.price)
        });
        toast.success('Plan updated!');
        setEditingPlan(null);
      } else {
        await api.post('/admin/plans', {
          ...newPlan,
          visits: parseInt(newPlan.visits),
          price: parseFloat(newPlan.price)
        });
        toast.success('Plan created!');
      }
      setPlanDialogOpen(false);
      setNewPlan({ name: '', name_ar: '', description: '', description_ar: '', visits: '', price: '' });
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to save plan');
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name || '',
      name_ar: plan.name_ar || '',
      description: plan.description || '',
      description_ar: plan.description_ar || '',
      visits: plan.visits?.toString() || '',
      price: plan.price?.toString() || ''
    });
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      toast.success('Plan deleted');
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  // Fetch parent details with kids
  const handleExpandParent = async (userId) => {
    if (expandedParent === userId) {
      setExpandedParent(null);
      setParentDetails(null);
      return;
    }
    setExpandedParent(userId);
    setLoadingParent(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setParentDetails(res.data);
    } catch (error) {
      toast.error('Failed to load details');
    } finally {
      setLoadingParent(false);
    }
  };

  // Gallery image upload handler
  const handleGalleryFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('يجب اختيار صورة');
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setGalleryPreview(ev.target.result);
    reader.readAsDataURL(file);
    
    setNewMedia(prev => ({ ...prev, file }));
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      let mediaUrl = newMedia.url;
      
      // If file selected, upload first
      if (newMedia.file) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', newMedia.file);
        const uploadRes = await api.post('/admin/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaUrl = uploadRes.data.image_url;
      }
      
      if (!mediaUrl) {
        toast.error('يرجى اختيار صورة أو إدخال رابط');
        return;
      }
      
      await api.post('/gallery', { url: mediaUrl, type: newMedia.type, title: newMedia.title });
      toast.success('تمت الإضافة!');
      setMediaDialogOpen(false);
      setNewMedia({ url: '', type: 'photo', title: '', file: null });
      setGalleryPreview(null);
      fetchDashboard();
    } catch (error) {
      toast.error('فشلت الإضافة');
    } finally {
      setUploadingImage(false);
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

  // Hero settings handlers
  const handleHeroImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setHeroImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploadingImage(true);
      const uploadRes = await api.post('/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHeroSettings({ ...heroSettings, hero_image: uploadRes.data.url });
      toast.success('تم رفع الصورة');
    } catch (error) {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    try {
      await api.put('/admin/settings', {
        hero_title: heroSettings.hero_title,
        hero_subtitle: heroSettings.hero_subtitle,
        hero_cta_text: heroSettings.hero_cta_text,
        hero_cta_route: heroSettings.hero_cta_route,
        hero_image: heroSettings.hero_image
      });
      toast.success('تم حفظ إعدادات الصفحة الرئيسية');
    } catch (error) {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setSavingHero(false);
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
          <div className="flex items-center gap-3">
            <img src={mascotImg} alt="" className="h-12 w-12 rounded-full border-2 border-[var(--peekaboo-green)] shadow" />
            <h1 className="font-heading text-3xl font-bold" data-testid="admin-title">
              <LayoutDashboard className="inline-block h-8 w-8 text-primary mr-2" />
              Admin Panel
            </h1>
          </div>
          <Button onClick={() => navigate('/reception')} className="rounded-full gap-2 bg-[var(--peekaboo-green)] hover:bg-[var(--peekaboo-green)]/90">
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
            <TabsTrigger value="homepage" className="rounded-full gap-2">
              <Home className="h-4 w-4" /> الصفحة الرئيسية
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
                    <div key={user.id} className="rounded-xl bg-muted/50 overflow-hidden">
                      <div 
                        className="flex justify-between items-center p-3 cursor-pointer hover:bg-muted/70"
                        onClick={() => handleExpandParent(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${expandedParent === user.id ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-secondary">{user.loyalty_points} pts</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setAdjustPointsDialogOpen(true);
                            }}
                          >
                            <Gift className="h-4 w-4 mr-1" /> Adjust
                          </Button>
                        </div>
                      </div>
                      
                      {/* Expandable Details */}
                      {expandedParent === user.id && (
                        <div className="p-4 border-t bg-white">
                          {loadingParent ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                          ) : parentDetails ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-bold mb-2">معلومات الوالد / Parent Info</h4>
                                <p className="text-sm"><span className="text-muted-foreground">الاسم:</span> {parentDetails.user?.name}</p>
                                <p className="text-sm"><span className="text-muted-foreground">البريد:</span> {parentDetails.user?.email}</p>
                                <p className="text-sm"><span className="text-muted-foreground">تاريخ التسجيل:</span> {parentDetails.user?.created_at ? new Date(parentDetails.user.created_at).toLocaleDateString('ar') : '-'}</p>
                                <p className="text-sm mt-2"><span className="text-muted-foreground">الحجوزات:</span> {(parentDetails.hourly_bookings?.length || 0) + (parentDetails.birthday_bookings?.length || 0)}</p>
                                <p className="text-sm"><span className="text-muted-foreground">الاشتراكات:</span> {parentDetails.subscriptions?.length || 0}</p>
                              </div>
                              <div>
                                <h4 className="font-bold mb-2">الأطفال / Children ({parentDetails.children?.length || 0})</h4>
                                {parentDetails.children?.length > 0 ? (
                                  <div className="space-y-2">
                                    {parentDetails.children.map(child => (
                                      <div key={child.id} className="p-2 rounded bg-muted/50 text-sm">
                                        <p className="font-semibold">{child.name}</p>
                                        {child.date_of_birth && <p className="text-muted-foreground">العمر: {new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()} سنة</p>}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">لا يوجد أطفال مسجلين</p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
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
                <CardTitle>Birthday Bookings {activeFilter === 'today' && <Badge className="ml-2 bg-pink-500">Today</Badge>}{activeFilter === 'custom_pending' && <Badge className="ml-2 bg-purple-500">Custom Pending</Badge>}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getFilteredBirthdayBookings().map((booking) => (
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
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">باقات الاشتراك / Subscription Plans</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">إدارة باقات الزيارات للعملاء</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-heading font-bold">{plan.name}</h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPlan(plan)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePlan(plan.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {plan.name_ar && <p className="text-sm text-muted-foreground" dir="rtl">{plan.name_ar}</p>}
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="mt-2 flex justify-between">
                          <span className="text-secondary font-bold">{plan.visits} visits</span>
                          <span className="font-bold">{plan.price} JD</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Bottom Action Bar */}
                <div className="pt-6 border-t mt-6 flex justify-end">
                  <Dialog open={planDialogOpen} onOpenChange={(open) => { setPlanDialogOpen(open); if (!open) { setEditingPlan(null); setNewPlan({ name: '', name_ar: '', description: '', description_ar: '', visits: '', price: '' }); } }}>
                    <DialogTrigger asChild>
                      <Button className="rounded-full gap-2 px-6">
                        <Plus className="h-4 w-4" /> إضافة باقة / Add Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingPlan ? 'تعديل الباقة / Edit Plan' : 'إنشاء باقة / Create Plan'}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreatePlan} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>الاسم (EN)</Label>
                            <Input value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                          <div>
                            <Label>الاسم (AR)</Label>
                            <Input value={newPlan.name_ar} onChange={(e) => setNewPlan({...newPlan, name_ar: e.target.value})} className="rounded-xl mt-1" dir="rtl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>الوصف (EN)</Label>
                            <Textarea value={newPlan.description} onChange={(e) => setNewPlan({...newPlan, description: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                          <div>
                            <Label>الوصف (AR)</Label>
                            <Textarea value={newPlan.description_ar} onChange={(e) => setNewPlan({...newPlan, description_ar: e.target.value})} className="rounded-xl mt-1" dir="rtl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>عدد الزيارات</Label>
                            <Input type="number" value={newPlan.visits} onChange={(e) => setNewPlan({...newPlan, visits: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                          <div>
                            <Label>السعر (JD)</Label>
                            <Input type="number" step="0.01" value={newPlan.price} onChange={(e) => setNewPlan({...newPlan, price: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                        </div>
                        <Button type="submit" className="w-full rounded-full">{editingPlan ? 'تحديث / Update' : 'إنشاء / Create'}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <h3 className="font-heading font-bold mb-4 mt-8">الاشتراكات النشطة / Active Subscriptions {activeFilter === 'active' && <Badge className="ml-2 bg-green-500">Active Only</Badge>}</h3>
                <div className="space-y-3">
                  {getFilteredSubscriptions().map((sub) => (
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
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">ثيمات أعياد الميلاد / Birthday Themes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">إدارة ثيمات الحفلات المتاحة للعملاء</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <Card key={theme.id} className="rounded-xl overflow-hidden">
                      {theme.image_url && (
                        <img src={theme.image_url} alt={theme.name} className="w-full h-32 object-cover" />
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-heading font-bold">{theme.name}</h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTheme(theme)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTheme(theme.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {theme.name_ar && <p className="text-sm text-muted-foreground" dir="rtl">{theme.name_ar}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{theme.description}</p>
                        <p className="text-accent font-bold mt-2">{theme.price} JD</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Bottom Action Bar */}
                <div className="pt-6 border-t flex justify-end">
                  <Dialog open={themeDialogOpen} onOpenChange={(open) => { setThemeDialogOpen(open); if (!open) { setEditingTheme(null); setNewTheme({ name: '', name_ar: '', description: '', description_ar: '', price: '', image_url: '' }); } }}>
                    <DialogTrigger asChild>
                      <Button className="rounded-full gap-2 px-6">
                        <Plus className="h-4 w-4" /> إضافة ثيم / Add Theme
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTheme ? 'تعديل الثيم / Edit Theme' : 'إنشاء ثيم / Create Theme'}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateTheme} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>الاسم (EN)</Label>
                            <Input value={newTheme.name} onChange={(e) => setNewTheme({...newTheme, name: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                          <div>
                            <Label>الاسم (AR)</Label>
                            <Input value={newTheme.name_ar} onChange={(e) => setNewTheme({...newTheme, name_ar: e.target.value})} className="rounded-xl mt-1" dir="rtl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>الوصف (EN)</Label>
                            <Textarea value={newTheme.description} onChange={(e) => setNewTheme({...newTheme, description: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                          <div>
                            <Label>الوصف (AR)</Label>
                            <Textarea value={newTheme.description_ar} onChange={(e) => setNewTheme({...newTheme, description_ar: e.target.value})} className="rounded-xl mt-1" dir="rtl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>السعر (JD)</Label>
                            <Input type="number" step="0.01" value={newTheme.price} onChange={(e) => setNewTheme({...newTheme, price: e.target.value})} className="rounded-xl mt-1" />
                          </div>
                          <div>
                            <Label>صورة الثيم</Label>
                            <Input 
                              type="file" 
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => handleImageUpload(e, setNewTheme)}
                              className="rounded-xl mt-1"
                              disabled={uploadingImage}
                            />
                            {newTheme.image_url && (
                              <img src={newTheme.image_url} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg" />
                            )}
                          </div>
                        </div>
                        <Button type="submit" className="w-full rounded-full" disabled={uploadingImage}>
                          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {editingTheme ? 'تحديث / Update' : 'إنشاء / Create'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">معرض الصور / Homepage Gallery</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">صور تظهر في الصفحة الرئيسية للعملاء</p>
              </CardHeader>
              <CardContent className="space-y-6">
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
                
                {/* Bottom Action Bar */}
                <div className="pt-6 border-t flex justify-end">
                  <Dialog open={mediaDialogOpen} onOpenChange={(open) => { setMediaDialogOpen(open); if (!open) { setGalleryPreview(null); setNewMedia({ url: '', type: 'photo', title: '', file: null }); } }}>
                    <DialogTrigger asChild>
                      <Button className="rounded-full gap-2 px-6">
                        <Plus className="h-4 w-4" /> إضافة صورة / Add Media
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة صورة / Add Gallery Media</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddMedia} className="space-y-4">
                        <div>
                          <Label>رفع صورة / Upload Image</Label>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={handleGalleryFileChange}
                            className="rounded-xl mt-1"
                            disabled={uploadingImage}
                          />
                          {galleryPreview && (
                            <img src={galleryPreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
                          )}
                        </div>
                        <div className="text-center text-sm text-muted-foreground">- أو / OR -</div>
                        <div>
                          <Label>رابط الصورة / URL (اختياري)</Label>
                          <Input value={newMedia.url} onChange={(e) => setNewMedia({...newMedia, url: e.target.value})} className="rounded-xl mt-1" placeholder="https://..." disabled={!!newMedia.file} />
                        </div>
                        <div>
                          <Label>النوع / Type</Label>
                          <Select value={newMedia.type} onValueChange={(v) => setNewMedia({...newMedia, type: v})}>
                            <SelectTrigger className="rounded-xl mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="photo">صورة / Photo</SelectItem>
                              <SelectItem value="video">فيديو / Video</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>العنوان / Title (اختياري)</Label>
                          <Input value={newMedia.title} onChange={(e) => setNewMedia({...newMedia, title: e.target.value})} className="rounded-xl mt-1" />
                        </div>
                        <Button type="submit" className="w-full rounded-full" disabled={uploadingImage}>
                          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          إضافة / Add Media
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">الإعدادات / Pricing & Capacity Settings</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">إعدادات الأسعار والسعة</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>سعر التذكرة بالساعة (JD)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      defaultValue={settings.hourly_price || 10}
                      onBlur={(e) => handleUpdateSettings('hourly_price', parseFloat(e.target.value))}
                      className="rounded-xl mt-2"
                    />
                  </div>
                  <div>
                    <Label>السعة الافتراضية</Label>
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
