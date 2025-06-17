import Navbar from '@/components/Navbar';

export default function About() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* About Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1cfeba]/10 text-[#1cfeba] text-xs tracking-wider uppercase mb-4">
              /ABOUT US
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Building the Future of Cloud Computing
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We're on a mission to make cloud computing more accessible, efficient, and developer-friendly. Our platform empowers developers to focus on building great applications without worrying about infrastructure.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { label: 'Active Users', value: '10,000+' },
              { label: 'Deployments', value: '1M+' },
              { label: 'Uptime', value: '99.99%' }
            ].map((stat, index) => (
              <div key={index} className="p-8 rounded-lg bg-[#1a1a1a] text-center">
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-400 uppercase tracking-wider text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-400 mb-4">
                We believe that every developer deserves access to powerful cloud infrastructure without the complexity. Our platform simplifies deployment, scaling, and management of applications, allowing developers to focus on what they do best - building amazing software.
              </p>
              <p className="text-gray-400">
                By combining cutting-edge technology with a developer-first approach, we're creating a more efficient and accessible cloud computing ecosystem for everyone.
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-8">
              <div className="space-y-4">
                {[
                  'Simplified Deployment Process',
                  'Automatic Scaling',
                  'Global Infrastructure',
                  'Developer-First Approach'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-[#1cfeba] flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              We're a passionate team of developers, designers, and cloud experts working together to revolutionize cloud computing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'John Doe', role: 'CEO & Founder' },
                { name: 'Jane Smith', role: 'CTO' },
                { name: 'Mike Johnson', role: 'Head of Engineering' }
              ].map((member, index) => (
                <div key={index} className="p-6 rounded-lg bg-[#1a1a1a]">
                  <div className="w-24 h-24 rounded-full bg-[#2a2a2a] mx-auto mb-4" />
                  <div className="font-bold mb-1">{member.name}</div>
                  <div className="text-gray-400 text-sm">{member.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Join Us in Shaping the Future</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Ready to experience the next generation of cloud computing? Start building with us today.
            </p>
            <a
              href="/signup"
              className="inline-block bg-[#1cfeba] text-black px-8 py-3 rounded-lg hover:bg-[#1cfeba]/90 transition-all font-medium"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </main>
  );
} 