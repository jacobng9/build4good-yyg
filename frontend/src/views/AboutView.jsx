import React from 'react';
import { motion } from 'framer-motion';

const AboutView = () => {
  const team = [
    { name: 'Preston Nguyen', role: 'Developer', linkedin: '#' },
    { name: 'Rei Iwata', role: 'Developer', linkedin: '#' },
    { name: 'Jacob Ng', role: 'Developer', linkedin: '#' },
    { name: 'Ethan Ho', role: 'Developer', linkedin: '#' },
  ];

  const sponsors = [
    { name: 'AggieX', link: 'https://aggiex.org' },
    { name: 'Aggies Create', link: 'https://aggiescreate.com' },
    { name: 'Texas A&M Engineering Entrepreneurship Program', link: 'https://engineering.tamu.edu/entrepreneurship/' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-4">About NotesViz</h1>
          <p className="text-xl text-gray-400">Built for the Build4Good YYG Hackathon.</p>
        </motion.div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 border-b border-gray-800 pb-2">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <a 
                key={i}
                href={member.linkedin}
                target="_blank"
                rel="noreferrer"
                className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700 hover:border-blue-500 hover:bg-gray-800/80 transition-all group"
              >
                <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full mb-4 group-hover:bg-blue-500/20 transition-colors flex items-center justify-center text-2xl">
                  👨‍💻
                </div>
                <h3 className="font-bold text-white mb-1">{member.name}</h3>
                <p className="text-sm text-gray-400">{member.role}</p>
              </a>
            ))}
          </div>
        </div>

        <div>
           <h2 className="text-2xl font-bold mb-8 border-b border-gray-800 pb-2">Special Thanks to our Sponsors</h2>
           <div className="flex flex-col space-y-4">
             {sponsors.map((sponsor, i) => (
               <a
                 key={i}
                 href={sponsor.link}
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center justify-between bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors group"
               >
                 <span className="font-semibold text-lg">{sponsor.name}</span>
                 <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
               </a>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default AboutView;
