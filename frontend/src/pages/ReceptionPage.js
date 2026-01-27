import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, User, Clock } from 'lucide-react';

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
      toast.error('Parent not found');
      setParent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (childId) => {
    try {
      await api.post('/staff/redeem-visit', { child_id: childId });
      toast.success('Session started');
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const handleEnd = async (sessionId) => {
    try {
      await api.post('/staff/end-session', { session_id: sessionId });
      toast.success('Session ended');
      handleSearch();
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Reception</h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Email or mobile"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
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
                <p>Email: {parent.email}</p>
                <p>Subscription: {parent.subscription?.remaining_visits || 0} visits left</p>
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
                          <Badge className="mt-2">
                            <Clock className="h-3 w-3 mr-1" />
                            Active ({new Date(child.active_session.end_time).toLocaleTimeString()})
                          </Badge>
                        ) : (
                          <p className="text-sm text-muted-foreground">No active session</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {child.active_session ? (
                          <Button variant="destructive" onClick={() => handleEnd(child.active_session.id)}>
                            End
                          </Button>
                        ) : (
                          <Button onClick={() => handleRedeem(child.id)} disabled={!parent.subscription?.remaining_visits}>
                            Start (1h)
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
