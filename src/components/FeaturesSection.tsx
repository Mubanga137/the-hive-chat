import { motion } from "framer-motion";
import { Store, Video, Landmark, Bot, Warehouse, Truck } from "lucide-react";

const features = [
  {
    title: "Storefront Management",
    subtitle: "Professional cataloging for physical goods, digital slots, and bookable services in one unified space.",
    icon: Store,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-50",
  },
  {
    title: "Creator Studio",
    subtitle: "Transform everyday photos and raw videos into interactive, shoppable social media experiences.",
    icon: Video,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    iconBg: "bg-orange-50",
  },
  {
    title: "Digital Ledger & Payouts",
    subtitle: "Automated transaction tracking with instant, frictionless Mobile Money settlements.",
    icon: Landmark,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconBg: "bg-blue-50",
  },
  {
    title: "Automated Secretary",
    subtitle: "Instantly generate professional text-based receipts and coordinate trackable logistics for every order.",
    icon: Bot,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    iconBg: "bg-purple-50",
  },
  {
    title: "Wholesale Sourcing Hub",
    subtitle: "Access exclusive partner vaults to instantly clone, markup, and resell high-demand inventory.",
    icon: Warehouse,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    iconBg: "bg-amber-50",
  },
  {
    title: "Autonomous Fulfillment",
    subtitle: "Connect seamlessly with campus runners, city riders, and secure storage nodes.",
    icon: Truck,
    color: "bg-rose-100 text-rose-700 border-rose-200",
    iconBg: "bg-rose-50",
  },
];

const FeaturesSection = () => (
  <section className="relative z-10 px-4 py-12 max-w-6xl mx-auto">
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
        <Store size={14} />
        Retailer Studio
      </div>
    </div>

    <div className="text-center mb-10">
      <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
        Everything You Need to <span className="text-primary">Grow</span>
      </h3>
      <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
        Professional tools and insights to transform your business on The Hive.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 * i }}
          className={`rounded-2xl border p-5 ${feature.color} hover:shadow-md transition-shadow cursor-default`}
        >
          <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
            <feature.icon size={22} />
          </div>
          <h4 className="font-bold text-base mb-1.5">{feature.title}</h4>
          <p className="text-sm opacity-80 leading-relaxed">{feature.subtitle}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-10 text-center"
    >
      <div className="inline-block rounded-2xl border border-primary/20 bg-card p-8 max-w-lg">
        <h4 className="text-xl font-display font-bold text-foreground mb-2">
          Ready to Transform Your Business?
        </h4>
        <p className="text-sm text-muted-foreground mb-5">
          Join thousands of SME vendors who are already using Retailer Studio to grow their businesses with professional tools and insights.
        </p>
        <a href="/retailer-studio" className="btn-gold inline-flex items-center justify-center gap-2 mx-auto px-8 py-3 text-sm">
          Get Started Free →
        </a>
      </div>
    </motion.div>
  </section>
);

export default FeaturesSection;
