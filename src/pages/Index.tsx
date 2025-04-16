
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, DollarSign, Users } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';

const Index = () => {
  const features = [
    {
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      title: 'Earn Commissions',
      description: 'Promote products from PAU student businesses and earn commissions on every sale you generate.'
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Access Student Marketers',
      description: 'Connect with motivated student affiliates to promote your products and increase sales.'
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: 'Simple & Transparent',
      description: 'Easy-to-use platform with clear commission rates and real-time tracking of all referrals and sales.'
    }
  ];

  const benefits = [
    { title: 'For Businesses', items: ['Increased exposure and sales', 'Access to motivated student marketers', 'Only pay for successful conversions', 'Built-in promotional tools'] },
    { title: 'For Affiliates', items: ['Flexible income opportunity', 'Promote quality campus products', 'Withdraw earnings anytime', 'Build valuable marketing skills'] }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-28 md:pt-32 px-6">
        <div className="container mx-auto text-center md:max-w-3xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-medium leading-tight tracking-tight mb-6">
            The Premier Affiliate Platform for <span className="text-primary">PAU Students</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10">
            Connect student businesses with student affiliates. Grow sales through peer-to-peer marketing and earn commissions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/auth/register?role=business">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Register as Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth/register?role=affiliate">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Become an Affiliate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 bg-secondary">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-medium tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              A simple and transparent platform connecting student businesses with student marketers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassCard
                key={index}
                hover
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-primary/10 p-3 rounded-full w-fit mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-medium tracking-tight mb-4">
              Benefits
            </h2>
            <p className="text-muted-foreground">
              Our platform offers unique advantages for both businesses and affiliates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <h3 className="text-xl font-medium mb-4 text-primary">{benefit.title}</h3>
                <ul className="space-y-3">
                  {benefit.items.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6 bg-primary/5">
        <div className="container mx-auto text-center md:max-w-2xl">
          <h2 className="text-3xl font-medium tracking-tight mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join PAU's premier affiliate platform today and start growing your business or earning commissions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth/register?role=business">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Register as Business
              </Button>
            </Link>
            <Link to="/auth/register?role=affiliate">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Become an Affiliate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
