import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import RetailerStudioDashboard from "./pages/RetailerStudioDashboard.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Warehouse from "./pages/Warehouse.tsx";
import GigRadar from "./pages/GigRadar.tsx";
import CustomerDashboard from "./pages/CustomerDashboard.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import StorePage from "./pages/StorePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import CreatorStudio from "./pages/studio/CreatorStudio.tsx";
import Products from "./pages/studio/Products.tsx";
import Services from "./pages/studio/Services.tsx";
import Orders from "./pages/studio/Orders.tsx";
import PulseCredits from "./pages/studio/PulseCredits.tsx";
import WholesaleBountyHub from "./pages/studio/WholesaleBountyHub.tsx";
import StorefrontBuilder from "./pages/studio/StorefrontBuilder.tsx";
import KantembaLedger from "./pages/studio/KantembaLedger.tsx";
import MarketingPromos from "./pages/studio/MarketingPromos.tsx";
import AnalyticsCustomers from "./pages/studio/AnalyticsCustomers.tsx";
import HiveEscrowWallet from "./pages/studio/HiveEscrowWallet.tsx";
import Messages from "./pages/Messages.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/store/:smeId" element={<StorePage />} />
            <Route path="/category/:name" element={<CategoryPage />} />

            {/* Customer — temporarily open */}
            <Route path="/customer-dash" element={<CustomerDashboard />} />

            {/* Vendor / SME — temporarily open */}
            <Route path="/retailer-studio" element={<RetailerStudioDashboard />} />
            <Route path="/studio" element={<RetailerStudioDashboard />} />
            <Route path="/retailer-studio/creator" element={<CreatorStudio />} />
            <Route path="/retailer-studio/products" element={<Products />} />
            <Route path="/retailer-studio/services" element={<Services />} />
            <Route path="/retailer-studio/orders" element={<Orders />} />
            <Route path="/retailer-studio/credits" element={<PulseCredits />} />
            <Route path="/retailer-studio/wholesale" element={<WholesaleBountyHub />} />
            <Route path="/retailer-studio/storefront" element={<StorefrontBuilder />} />
            <Route path="/retailer-studio/kantemba" element={<KantembaLedger />} />
            <Route path="/retailer-studio/marketing" element={<MarketingPromos />} />
            <Route path="/retailer-studio/analytics" element={<AnalyticsCustomers />} />
            <Route path="/retailer-studio/escrow" element={<HiveEscrowWallet />} />

            {/* Wholesaler — temporarily open */}
            <Route path="/warehouse" element={<Warehouse />} />

            {/* Gig Worker — temporarily open */}
            <Route path="/gig-radar" element={<GigRadar />} />

            {/* Messaging — accessible to all roles */}
            <Route path="/messages" element={<Messages />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
