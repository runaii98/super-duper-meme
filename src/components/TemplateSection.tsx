import React from 'react';
import Image from 'next/image';

const templates = [
  {
    name: 'PyTorch',
    icon: '/icons/pytorch.svg',
    description: 'Deploy PyTorch models with ease',
    color: '#1cfeba'
  },
  {
    name: 'TensorFlow',
    icon: '/icons/tensorflow.svg',
    description: 'Run TensorFlow workloads instantly',
    color: '#1cfeba'
  },
  {
    name: 'Docker',
    icon: '/icons/docker.svg',
    description: 'Use custom Docker containers',
    color: '#1cfeba'
  },
  {
    name: 'Custom',
    icon: '/icons/custom.svg',
    description: 'Bring your own environment',
    color: '#1cfeba'
  }
];

export default function TemplateSection() {
  return (
    <section className="w-full py-24 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Choose from 50+ templates ready out-of-the-box,{' '}
              <span className="text-[#1cfeba]">
                or bring your own custom container.
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              Get setup instantly with PyTorch, TensorFlow, or any other preconfigured
              environment you might need for your machine learning workflow.
            </p>
            <p className="text-gray-400 text-lg">
              Along with managed and community templates, we also let you configure
              your own template to fit your deployment needs.
            </p>
            <button className="bg-[#1cfeba] hover:bg-[#1cfeba]/90 text-black px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2">
              Browse templates
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Right Content - Template Grid */}
          <div className="relative">
            <div className="bg-[#111] rounded-2xl p-6 shadow-2xl border border-[#1cfeba]/10">
              {/* Mac-style window controls */}
              <div className="flex space-x-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.name}
                    className="bg-black/50 backdrop-blur-sm rounded-xl p-6 hover:bg-black/70 transition-all duration-200 border border-[#1cfeba]/10 hover:border-[#1cfeba]/20"
                  >
                    <div className="flex flex-col space-y-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${template.color}10` }}
                      >
                        <Image
                          src={template.icon}
                          alt={template.name}
                          width={32}
                          height={32}
                          className="opacity-80"
                        />
                      </div>
                      <h3 className="text-white font-medium text-lg">
                        {template.name}
                      </h3>
                      <button className="bg-[#1cfeba] hover:bg-[#1cfeba]/90 text-black px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105">
                        Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 