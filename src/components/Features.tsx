'use client';

import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: "Instant Boot-up",
    description: "Launch your instances in seconds, not minutes. Our optimized container infrastructure ensures lightning-fast startup times for all applications.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Enterprise-Grade Hardware",
    description: "Access to the latest NVIDIA GPUs including T4, A100, and H100. High-performance computing without the high costs of dedicated hardware.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  {
    title: "No Quota Limits",
    description: "Say goodbye to quota increase requests. Our platform automatically scales with your needs, without artificial limitations or lengthy approval processes.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Integrated Cloud Storage",
    description: "Built-in S3-compatible storage for seamless data management. Store and access your models, datasets, and outputs with high-speed, low-latency connections.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    title: "Cost-Effective Pricing",
    description: "Benefit from our shared container infrastructure that significantly reduces costs. Pay only for what you use with no hidden fees or minimum commitments.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Global Deployment",
    description: "Deploy your applications across our worldwide network of data centers. Ensure low-latency access for users anywhere in the world.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1cfeba]/5 to-purple-500/5 opacity-20" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(28,254,186,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(28,254,186,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-block bg-[#1cfeba]/10 rounded-full px-4 py-1 mb-4">
            <p className="text-[#1cfeba] text-sm font-mono uppercase tracking-wider">/ADVANTAGES</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Why Choose Our Cloud Service?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Experience enterprise-grade infrastructure with the simplicity of a cloud service. 
            Built for developers who demand performance without complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] 
                hover:border-[#1cfeba]/50 hover:shadow-[0_0_30px_rgba(28,254,186,0.1)]
                transition-all duration-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#1cfeba]/10 
                  flex items-center justify-center text-[#1cfeba] 
                  group-hover:bg-[#1cfeba] group-hover:text-black transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold group-hover:text-[#1cfeba] transition-colors">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
              
              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1cfeba]/5 to-purple-500/5 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 