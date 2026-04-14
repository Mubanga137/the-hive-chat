import { Mail, Phone, MapPin } from "lucide-react";
import hiveLogo from "@/assets/hive-logo.jpeg";

const footerLinks = {
  Company: [
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "Careers", href: "#" },
  ],
  Retailers: [
    { label: "Retailer Studio", href: "/studio" },
    { label: "Pricing", href: "#" },
    { label: "Partner Program", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};

const socials = [
  { label: "Facebook", icon: "f", href: "https://facebook.com" },
  { label: "Twitter", icon: "𝕏", href: "https://x.com" },
  { label: "Instagram", icon: "◎", href: "https://instagram.com" },
  { label: "LinkedIn", icon: "in", href: "https://linkedin.com" },
];

const Footer = () => (
  <footer className="relative z-10 border-t border-border bg-card mt-8">
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <img src={hiveLogo} alt="The Hive" className="w-9 h-9 rounded-full object-cover border border-primary/30" />
            <span className="text-primary text-xl font-display font-bold tracking-tight">THE HIVE</span>
          </div>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Empowering entrepreneurs and elevating everyday shopping across Zambia.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a href="mailto:hello@thehive.co.zm" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail size={14} /> hello@thehive.co.zm
            </a>
            <a href="tel:+260971000000" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone size={14} /> +260 971 000 000
            </a>
            <span className="flex items-center gap-2">
              <MapPin size={14} /> Lusaka, Zambia
            </span>
          </div>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="font-display font-bold text-foreground text-sm mb-3">{title}</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} The Hive. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
