'use client';

const features = [
  {
    title: 'SD WebUI',
    description: 'Automatic1111 Stable Diffusion is a powerful tool that completely revolutionizes the way we create images.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: 'ComfyUI',
    description: 'ComfyUI is an AI drawing tool that utilizes StableDiffusion, offering a sleek and versatile interface.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: 'FaceFusion',
    description: 'FaceFusion is the next generation face swapper and enhancer to create realistic and high-quality face swaps.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: 'AI-Toolkit',
    description: 'AI-Toolkit is designed for both ease of use and high performance, empowering users to seamlessly work with AI.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    title: 'RVC',
    description: 'RVC is an advanced voice conversion system based on VITS, designed to provide a convenient voice changing experience.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-7.072m-2.828 9.9a9 9 0 010-12.728M12 18a6 6 0 100-12 6 6 0 000 12z" />
      </svg>
    )
  },
  {
    title: 'Fooocus',
    description: 'Fooocus is an open-source image generation software that focuses on usability and high-quality outputs.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-20h2a2 2 0 012 2v2m0 12v2a2 2 0 01-2 2h-2M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v1m0 6v1m4-4h-1m-6 0H8" />
      </svg>
    )
  },
  {
    title: 'WebUI Forge',
    description: 'At the core of the SD WebUI Forge is a cutting-edge interface that combines the power of AI with ease of use.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: 'InvokeAI',
    description: 'InvokeAI is a leading creative engine for Stable Diffusion models, featuring an intuitive interface.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    )
  },
  {
    title: 'Kohya_ss',
    description: 'Advanced LoRA training interface with support for multiple training methods and architectures.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  {
    title: 'DreamBooth',
    description: 'Fine-tune Stable Diffusion models with your own images for personalized generation.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: 'AnimateAnyone',
    description: 'Create stunning animations from single images with advanced AI technology.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: 'AudioCraft',
    description: 'Generate high-quality music and sound effects using state-of-the-art AI models.',
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )
  }
];

export default function Features() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headers */}
        <div className="flex justify-center gap-8 mb-16">
          <button className="group flex items-center gap-2 px-6 py-3 bg-[#111111] rounded-xl border border-[#222222] transition-all duration-500 hover:shadow-[0_0_2rem_-0.5rem_#1cfeba30] hover:border-emerald-500/20">
            <div className="relative w-8 h-8 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-white font-medium">LANGUAGE MODELS</span>
          </button>

          <button className="group flex items-center gap-2 px-6 py-3 bg-[#111111] rounded-xl border border-[#222222] transition-all duration-500 hover:shadow-[0_0_2rem_-0.5rem_#1cfeba30] hover:border-emerald-500/20">
            <div className="relative w-8 h-8 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-white font-medium">AI STACK</span>
          </button>

          <button className="group flex items-center gap-2 px-6 py-3 bg-emerald-400/10 rounded-xl border border-emerald-400/20 transition-all duration-500 hover:shadow-[0_0_2rem_-0.5rem_#1cfeba30] hover:border-emerald-500/20">
            <div className="relative w-8 h-8 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-emerald-400 font-medium">WEB FRAMEWORKS / STARTER</span>
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-base text-emerald-400 font-semibold tracking-wide uppercase">/FEATURES</h2>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Everything You Need to Scale
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-400 lg:mx-auto">
            Built for developers who want to focus on code, not infrastructure.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative p-8 bg-[#111111] rounded-xl border border-[#222222] transition-all duration-500 group-hover:shadow-[0_0_2rem_-0.5rem_#1cfeba30] group-hover:border-emerald-500/20">
                  {/* Feature Icon Container */}
                  <div className="relative flex items-center justify-center mb-8">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-emerald-400/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
                    
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-emerald-400/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    {/* Icon background with 3D effect */}
                    <div className="relative z-10 w-20 h-20 bg-black rounded-2xl border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20 group-hover:transform group-hover:translate-y-[-2px]">
                      {/* Larger icon */}
                      <div className="transform scale-150 transition-transform duration-500 group-hover:scale-[1.7]">
                        {feature.icon}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-4 text-center group-hover:text-emerald-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 text-center">
                    {feature.description}
                  </p>

                  {/* Enhanced 3D background layers */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/5 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="absolute -z-10 inset-0 bg-[#111111] rounded-xl transform-gpu transition-transform duration-500 ease-out origin-center group-hover:scale-105 group-hover:rotate-[-2deg] group-hover:translate-x-2"></div>
                  <div className="absolute -z-20 inset-0 bg-emerald-500/5 rounded-xl transform-gpu transition-transform duration-500 ease-out origin-center group-hover:scale-110 group-hover:rotate-[-4deg] group-hover:translate-x-4"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Section */}
          <div className="mt-20 relative group">
            <div className="relative p-8 bg-[#111111] rounded-xl border border-[#222222] transition-all duration-500 group-hover:shadow-[0_0_2rem_-0.5rem_#1cfeba30] group-hover:border-emerald-500/20 z-10">
              <h3 className="text-2xl font-bold text-white mb-6">Why Choose ComfyUI?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Up to <span className="text-emerald-400 font-semibold">70% cost reduction</span> compared to traditional deployment methods</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Deploy in <span className="text-emerald-400 font-semibold">seconds</span> with zero configuration</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Access to <span className="text-emerald-400 font-semibold">latest GPU technology</span> including H100s</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Ultra-low latency with <span className="text-emerald-400 font-semibold">50ms response times</span></p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Vanilla containers for <span className="text-emerald-400 font-semibold">maximum compatibility</span></p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-black rounded-lg border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Intelligent <span className="text-emerald-400 font-semibold">auto-scaling</span> based on demand</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Background layers for comparison section */}
            <div className="absolute -z-10 inset-0 bg-[#111111] rounded-xl transform-gpu transition-transform duration-500 ease-out origin-center group-hover:scale-105 group-hover:rotate-[-2deg] group-hover:translate-x-2"></div>
            <div className="absolute -z-20 inset-0 bg-emerald-500/5 rounded-xl transform-gpu transition-transform duration-500 ease-out origin-center group-hover:scale-110 group-hover:rotate-[-4deg] group-hover:translate-x-4"></div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          opacity: 0;
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
} 