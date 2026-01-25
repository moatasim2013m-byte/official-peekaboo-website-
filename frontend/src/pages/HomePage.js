import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { Clock, Cake, Star, ChevronRight, Play } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, api } = useAuth();
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await api.get('/gallery');
        setGallery(response.data.media || []);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      }
    };
    fetchGallery();
  }, []);

  const features = [
    {
      icon: Clock,
      title: 'Hourly Play',
      description: 'Book 1-hour play sessions for your kids. Pick your perfect time slot!',
      link: '/tickets',
      color: 'bg-primary',
      buttonText: 'Book Now'
    },
    {
      icon: Cake,
      title: 'Birthday Parties',
      description: 'Celebrate with 10 amazing themes! Custom parties available too.',
      link: '/birthday',
      color: 'bg-accent',
      buttonText: 'Plan Party'
    },
    {
      icon: Star,
      title: 'Subscriptions',
      description: 'Save big with visit packages. 30-day validity, unlimited fun!',
      link: '/subscriptions',
      color: 'bg-secondary',
      buttonText: 'Subscribe'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-hero-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6" data-testid="hero-title">
                Where Kids <span className="text-primary">Play</span> & 
                <span className="text-accent"> Celebrate!</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                The ultimate indoor playground experience! Book play sessions, throw unforgettable birthday parties, 
                and save with our subscription packages.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/tickets">
                  <Button size="lg" className="rounded-full btn-playful text-lg px-8" data-testid="hero-book-btn">
                    Book a Session
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="rounded-full text-lg px-8" data-testid="hero-signup-btn">
                      Sign Up Free
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/19875328/pexels-photo-19875328.jpeg"
                alt="Kids playing at Peekaboo"
                className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                data-testid="hero-image"
              />
              <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-heading font-bold shadow-lg">
                Open 10AM - 10PM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4" data-testid="features-title">
              What We Offer
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for the perfect play day!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 rounded-3xl card-interactive overflow-hidden"
                data-testid={`feature-card-${index}`}
              >
                <CardContent className="p-8">
                  <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <Link to={feature.link}>
                    <Button className="rounded-full btn-playful w-full" data-testid={`feature-btn-${index}`}>
                      {feature.buttonText}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4" data-testid="gallery-title">
              Fun Moments at Peekaboo
            </h2>
            <p className="text-muted-foreground text-lg">
              See what makes us special!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {gallery.length > 0 ? (
              gallery.slice(0, 6).map((item, index) => (
                <div 
                  key={item.id} 
                  className={`relative rounded-2xl overflow-hidden ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                  data-testid={`gallery-item-${index}`}
                >
                  {item.type === 'video' ? (
                    <div className="relative aspect-square bg-muted">
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.title || 'Gallery image'} 
                      className={`w-full object-cover ${index === 0 ? 'aspect-square' : 'aspect-square'}`}
                    />
                  )}
                </div>
              ))
            ) : (
              // Placeholder gallery items
              <>
                <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/19875328/pexels-photo-19875328.jpeg"
                    alt="Kids playing"
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/6148511/pexels-photo-6148511.jpeg"
                    alt="Birthday party"
                    className="w-full object-cover aspect-square"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/3951099/pexels-photo-3951099.png"
                    alt="Family fun"
                    className="w-full object-cover aspect-square"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 md:py-24 bg-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6" data-testid="cta-title">
              Ready to Join the Fun?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Create your free account to book sessions, track loyalty points, and get exclusive offers!
            </p>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="rounded-full text-lg px-10 btn-playful"
                data-testid="cta-signup-btn"
              >
                Sign Up Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
