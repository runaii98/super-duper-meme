'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "CTO",
    company: "TechVision",
    content: "ComfyUI has revolutionized our deployment process. What used to take days now takes minutes.",
    stars: 5
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    role: "Lead Developer",
    company: "DataFlow",
    content: "The reliability and performance of ComfyUI's infrastructure is unmatched. It's a game-changer.",
    stars: 5
  },
  {
    id: 3,
    name: "Emily Thompson",
    role: "Engineering Manager",
    company: "ScaleAI",
    content: "We've cut our infrastructure costs by 60% while improving performance. Simply incredible.",
    stars: 5
  },
  {
    id: 4,
    name: "David Kim",
    role: "ML Engineer",
    company: "AILabs",
    content: "The AI model deployment capabilities are outstanding. Perfect for our machine learning needs.",
    stars: 5
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Product Lead",
    company: "TechForward",
    content: "Seamless integration and incredible support. Our team loves working with ComfyUI.",
    stars: 5
  },
  // Duplicate the first 5 testimonials to create 10 total for each row
  {
    id: 6,
    name: "James Wilson",
    role: "CTO",
    company: "CloudTech",
    content: "The scalability and reliability of ComfyUI has transformed our development workflow.",
    stars: 5
  },
  {
    id: 7,
    name: "Mark Stevens",
    role: "AI Lead",
    company: "InnovateAI",
    content: "The best platform we've used for deployment. It's transformed our workflow.",
    stars: 5
  },
  {
    id: 8,
    name: "Rachel Zhang",
    role: "DevOps Lead",
    company: "FastScale",
    content: "Incredible performance and easy to use. Our team's productivity has doubled.",
    stars: 5
  },
  {
    id: 9,
    name: "Alex Martinez",
    role: "Software Architect",
    company: "BuildFast",
    content: "The developer experience is unmatched. Everything just works seamlessly.",
    stars: 5
  },
  {
    id: 10,
    name: "Sophie Anderson",
    role: "Engineering Director",
    company: "TechPro",
    content: "ComfyUI has become an essential part of our infrastructure. Couldn't be happier.",
    stars: 5
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  return (
    <div className="w-[400px] p-6 mx-4 bg-[#1a1a1a] rounded-lg shadow-lg">
      <div className="flex items-center space-x-1 mb-2">
        {[...Array(testimonial.stars)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-[#00ff9d]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-gray-300 mb-4 text-lg">"{testimonial.content}"</p>
      <div>
        <p className="font-semibold text-white">{testimonial.name}</p>
        <p className="text-gray-400 text-sm">{testimonial.role} at {testimonial.company}</p>
      </div>
    </div>
  );
};

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 overflow-hidden bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Trusted by Developers Worldwide</h2>
          <p className="text-gray-400 text-lg">
            Join thousands of developers and companies who are building the future with ComfyUI.
          </p>
        </div>
        
        <div className="relative">
          {/* First row - moving right */}
          <div className="mb-8">
            <motion.div
              animate={{
                x: [0, -1920],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 50,
                  ease: "linear",
                },
              }}
              className="flex"
            >
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
              ))}
            </motion.div>
          </div>

          {/* Second row - moving left */}
          <div>
            <motion.div
              animate={{
                x: [-1920, 0],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 50,
                  ease: "linear",
                },
              }}
              className="flex"
            >
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard key={`${testimonial.id}-${index}-reverse`} testimonial={testimonial} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 