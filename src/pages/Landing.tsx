import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Lock, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-slate-950">EZ</span>
          </div>
          <span className="text-xl font-bold text-white">EZEIGBO</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-white hover:bg-purple-800">
              Login
            </Button>
          </Link>
          <Link to="/admin-login">
            <Button variant="ghost" className="text-white hover:bg-purple-800">
              Admin
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Grow Your Wealth with <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">EZEIGBO</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            A secure, trusted investment platform designed for Nigerians. Invest, earn rewards, and withdraw with confidence.
          </p>
        </div>

        <Link to="/register">
          <Button size="lg" className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold text-lg px-8 py-6">
            Start Investing Now <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-slate-950" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Daily Rewards</h3>
            <p className="text-gray-300">Earn consistent daily rewards on your investments. Watch your wealth grow steadily.</p>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-slate-950" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Secure & Trusted</h3>
            <p className="text-gray-300">Your funds are protected with enterprise-grade security and transparent operations.</p>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-slate-950" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Quick Withdrawals</h3>
            <p className="text-gray-300">Withdraw your earnings easily. Manual verification ensures your security.</p>
          </div>
        </div>
      </div>

      {/* Investment Packages */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Investment Packages</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { name: "Condom", amount: "₦500", rate: "2%", color: "from-blue-500" },
            { name: "Ulo", amount: "₦1,000", rate: "2.5%", color: "from-purple-500" },
            { name: "Echi", amount: "₦3,000", rate: "3%", color: "from-pink-500" },
            { name: "TaTa", amount: "₦5,000", rate: "3.5%", color: "from-amber-500" },
          ].map((pkg) => (
            <div key={pkg.name} className={`bg-gradient-to-br ${pkg.color} to-slate-900 rounded-xl p-6 border border-white/10`}>
              <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
              <p className="text-3xl font-bold text-amber-400 mb-2">{pkg.amount}</p>
              <p className="text-sm text-gray-300 mb-4">Daily reward: <span className="text-amber-400 font-bold">{pkg.rate}</span></p>
              <p className="text-xs text-gray-400">15-day investment period</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Start?</h2>
        <p className="text-xl text-gray-300 mb-8">Join thousands of Nigerians building wealth with EZEIGBO</p>
        <Link to="/register">
          <Button size="lg" className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold text-lg px-8 py-6">
            Create Account Now
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400 text-sm">
          <p>© 2024 EZEIGBO. All rights reserved. Investment involves risk. Please read our terms carefully.</p>
        </div>
      </div>
    </div>
  );
}
