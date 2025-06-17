'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, ArrowUpRight, Code, Brain, Cpu, Cloud, Database, Image, Video, Settings } from 'lucide-react';

const testimonials = [
  {
    quote: "ComfyUI has revolutionized our deployment process. What used to take days now takes minutes.",
    author: "Sarah Chen",
    role: "CTO at TechVision",
    rating: 5,
    icon: <Code className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "The reliability and performance of ComfyUI's infrastructure is unmatched. It's a game-changer.",
    author: "Michael Rodriguez",
    role: "Lead Developer at DataFlow",
    rating: 5,
    icon: <Brain className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "We've cut our infrastructure costs by 60% while improving performance. Simply incredible.",
    author: "Emily Thompson",
    role: "Engineering Manager at ScaleAI",
    rating: 5,
    icon: <Cpu className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "The AI model deployment capabilities are outstanding. Perfect for our machine learning needs.",
    author: "David Kim",
    role: "ML Engineer at AILabs",
    rating: 5,
    icon: <Cloud className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "Seamless integration and incredible support. Our team loves working with ComfyUI.",
    author: "Lisa Wang",
    role: "Product Lead at TechForward",
    rating: 5,
    icon: <Database className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "The image generation pipeline reduced our processing time by 80%. Absolutely phenomenal.",
    author: "James Wilson",
    role: "CTO at PixelPerfect",
    rating: 5,
    icon: <Image className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "Video processing has never been easier. ComfyUI handles everything flawlessly.",
    author: "Ana Martinez",
    role: "Video Lead at StreamLabs",
    rating: 5,
    icon: <Video className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "The platform's flexibility and scalability are exactly what we needed for our growing team.",
    author: "Tom Anderson",
    role: "DevOps Lead at CloudScale",
    rating: 5,
    icon: <Settings className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "Outstanding performance and reliability. ComfyUI exceeded all our expectations.",
    author: "Rachel Lee",
    role: "Tech Director at FutureStack",
    rating: 5,
    icon: <Brain className="w-6 h-6 text-emerald-400" />
  },
  {
    quote: "The best platform we've used for AI deployment. It's transformed our workflow.",
    author: "Mark Stevens",
    role: "AI Lead at InnovateAI",
    rating: 5,
    icon: <Cpu className="w-6 h-6 text-emerald-400" />
  }
];

export default function TestimonialSlider() {
  const [isVisible, setIsVisible] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-10 bg-gradient-to-b from-black to-[#111]">
      {/* First Slider - Left to Right */}
      <div className="relative">
        <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-black to-transparent z-10" />
        <div 
          ref={sliderRef}
          className={`flex transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            width: 'fit-content',
            animation: isVisible ? 'slide-left 40s linear infinite' : 'none'
          }}
        >
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={`${testimonial.author}-${index}`}
              className="flex-none w-[400px] mx-4 bg-[#111] p-6 rounded-xl border border-emerald-900/10 hover:border-emerald-500/20 transition-all duration-500 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  {testimonial.icon}
                </div>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-400 mb-4">"{testimonial.quote}"</blockquote>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{testimonial.author}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Second Slider - Right to Left */}
      <div className="relative mt-8">
        <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-black to-transparent z-10" />
        <div 
          className={`flex transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            width: 'fit-content',
            animation: isVisible ? 'slide-right 40s linear infinite' : 'none'
          }}
        >
          {[...testimonials].reverse().concat([...testimonials].reverse()).map((testimonial, index) => (
            <div
              key={`${testimonial.author}-${index}-reverse`}
              className="flex-none w-[400px] mx-4 bg-[#111] p-6 rounded-xl border border-emerald-900/10 hover:border-emerald-500/20 transition-all duration-500 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  {testimonial.icon}
                </div>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-400 mb-4">"{testimonial.quote}"</blockquote>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{testimonial.author}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slide-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
} 