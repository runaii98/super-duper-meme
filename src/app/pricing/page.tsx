'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: 'Base',
      description: 'Perfect for individual developers and small projects',
      price: isAnnual ? 49 : 59,
      features: [
        'NVIDIA T4 GPU',
        '16GB GDDR6 GPU RAM',
        '32GB DDR4 System RAM',
        '8 vCPU Cores',
        '50GB NVMe SSD',
        '1TB/month Bandwidth',
        '3 Deployment Regions',
        'Basic Auto-scaling'
      ],
      highlighted: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Pro',
      description: 'For growing teams with advanced computing needs',
      price: isAnnual ? 199 : 239,
      features: [
        'NVIDIA L4 or A40 GPU',
        '48GB GDDR6 GPU RAM',
        '64GB DDR4 System RAM',
        '16 vCPU Cores',
        '200GB NVMe SSD',
        '5TB/month Bandwidth',
        'All Deployment Regions',
        'Advanced Auto-scaling'
      ],
      highlighted: true,
      cta: 'Get Started'
    },
    {
      name: 'Super Pro',
      description: 'Enterprise-grade infrastructure for maximum performance',
      price: isAnnual ? 999 : 1199,
      features: [
        'NVIDIA A100/H100 GPU',
        '80GB HBM2e GPU RAM',
        '256GB DDR4 System RAM',
        '32 vCPU Cores',
        '500GB NVMe SSD',
        'Unlimited Bandwidth',
        'All Regions + Priority',
        'Enterprise Auto-scaling'
      ],
      highlighted: false,
      cta: 'Contact Sales'
    }
  ];

  const comparisons = [
    {
      category: 'Computing Power',
      features: [
        {
          name: 'GPU Memory',
          starter: '2GB',
          pro: '16GB',
          enterprise: 'Custom'
        },
        {
          name: 'Concurrent Jobs',
          starter: '2',
          pro: '10',
          enterprise: 'Unlimited'
        },
        {
          name: 'Queue Priority',
          starter: 'Standard',
          pro: 'High',
          enterprise: 'Highest'
        }
      ]
    },
    {
      category: 'Features',
      features: [
        {
          name: 'API Access',
          starter: '✓',
          pro: '✓',
          enterprise: '✓'
        },
        {
          name: 'Custom Domain',
          starter: '✗',
          pro: '✓',
          enterprise: '✓'
        },
        {
          name: 'Team Management',
          starter: '✗',
          pro: '✓',
          enterprise: '✓'
        }
      ]
    },
    {
      category: 'Support',
      features: [
        {
          name: 'Response Time',
          starter: '48h',
          pro: '24h',
          enterprise: '1h'
        },
        {
          name: 'Phone Support',
          starter: '✗',
          pro: '✗',
          enterprise: '✓'
        },
        {
          name: 'Dedicated Manager',
          starter: '✗',
          pro: '✗',
          enterprise: '✓'
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      <div className="min-h-screen bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Choose the perfect plan for your needs
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isAnnual ? 'text-emerald-400' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-400/10 transition-colors focus:outline-none"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-emerald-400 transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-emerald-400' : 'text-gray-400'}`}>
                Annually <span className="text-emerald-400/70">(Save 20%)</span>
              </span>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-20">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative p-8 bg-[#111111] rounded-xl border ${
                  tier.highlighted
                    ? 'border-emerald-500/50 shadow-[0_0_2rem_-0.5rem_#1cfeba50]'
                    : 'border-[#222222]'
                } transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_0_2rem_-0.5rem_#1cfeba30] group`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-400/10 rounded-full border border-emerald-400/20">
                    <span className="text-sm font-medium text-emerald-400">Most Popular</span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm">{tier.description}</p>
                  <div className="mt-4 flex items-baseline">
                    {typeof tier.price === 'number' ? (
                      <>
                        <span className="text-4xl font-bold text-white">${tier.price}</span>
                        <span className="text-gray-400 ml-2">/month</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-white">{tier.price}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-400">
                      <svg
                        className="w-5 h-5 text-emerald-400 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg text-sm font-medium transition-all duration-300 ${
                    tier.highlighted
                      ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                      : 'bg-[#222222] text-white hover:bg-[#333333]'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">Compare Plans</h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Get a detailed overview of what each plan includes to make the best choice for your needs
            </p>
            
            <div className="overflow-x-auto rounded-xl border border-[#222222] bg-[#0A0A0A] shadow-2xl">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="py-6 px-6 text-left text-sm font-medium text-gray-400 bg-[#111111]">Features</th>
                    <th className="py-6 px-6 text-left text-sm font-medium">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-semibold mb-1">Starter</span>
                        <span className="text-gray-500 text-xs">For individuals</span>
                      </div>
                    </th>
                    <th className="py-6 px-6 text-left text-sm font-medium bg-emerald-400/5">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-semibold mb-1">Pro</span>
                        <span className="text-gray-500 text-xs">For teams</span>
                      </div>
                    </th>
                    <th className="py-6 px-6 text-left text-sm font-medium">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-semibold mb-1">Enterprise</span>
                        <span className="text-gray-500 text-xs">For organizations</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((section) => (
                    <>
                      <tr key={section.category}>
                        <td
                          colSpan={4}
                          className="py-6 px-6 text-sm font-semibold text-emerald-400 bg-emerald-400/5 border-t border-b border-[#222222]"
                        >
                          {section.category}
                        </td>
                      </tr>
                      {section.features.map((feature) => (
                        <tr 
                          key={feature.name} 
                          className="border-b border-[#222222] transition-colors hover:bg-[#111111]"
                        >
                          <td className="py-4 px-6 text-sm font-medium text-gray-300">{feature.name}</td>
                          <td className="py-4 px-6">
                            {feature.starter === '✓' ? (
                              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : feature.starter === '✗' ? (
                              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            ) : (
                              <span className="text-sm text-gray-400">{feature.starter}</span>
                            )}
                          </td>
                          <td className="py-4 px-6 bg-emerald-400/5">
                            {feature.pro === '✓' ? (
                              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : feature.pro === '✗' ? (
                              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            ) : (
                              <span className="text-sm text-gray-400">{feature.pro}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {feature.enterprise === '✓' ? (
                              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : feature.enterprise === '✗' ? (
                              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            ) : (
                              <span className="text-sm text-gray-400">{feature.enterprise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
} 