import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-cream border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🎪</span>
              <span className="font-heading text-2xl font-bold text-primary">Peekaboo</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              The ultimate indoor playground for kids! Book hourly play sessions, celebrate birthdays, 
              and enjoy savings with our subscription packages.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/tickets" className="text-muted-foreground hover:text-primary transition-colors">
                  Hourly Tickets
                </Link>
              </li>
              <li>
                <Link to="/birthday" className="text-muted-foreground hover:text-primary transition-colors">
                  Birthday Parties
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-muted-foreground hover:text-primary transition-colors">
                  Subscriptions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Hours</h4>
            <p className="text-muted-foreground">
              Open Daily<br />
              10:00 AM - 10:00 PM
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Peekaboo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
