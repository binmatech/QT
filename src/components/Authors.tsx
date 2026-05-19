import { motion } from "motion/react";
import { AUTHORS } from "../constants";
import { Twitter, Linkedin, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getExperts } from "../services/expertService";
import { Expert } from "../types";

export default function Authors() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      try {
        const data = await getExperts();
        setExperts(data);
      } catch (error) {
        console.error("Error fetching experts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  if (!loading && experts.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="editorial-label text-brand-accent mb-4 block">The Newsroom</span>
            <h2 className="text-4xl md:text-5xl font-editorial font-bold mb-4">Meet the Experts</h2>
            <p className="text-slate-500">The minds behind the most impactful stories in tech and business.</p>
          </div>
          <button className="editorial-label text-black hover:text-brand-accent transition-colors">
            Apply to Contribute
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-accent" size={32} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 border-t border-l border-slate-100">
            {experts.map((expert, idx) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-12 border-r border-b border-slate-100 group relative overflow-hidden hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <img 
                      src={expert.image} 
                      alt={expert.name} 
                      className="w-20 h-20 rounded-full object-cover border border-slate-200 p-1 relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="font-editorial font-bold text-2xl mb-1">{expert.name}</h3>
                  <p className="editorial-label text-brand-accent mb-4">{expert.title}</p>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-3">{expert.bio}</p>
                  
                  <div className="pt-4 border-t border-slate-50 w-full mb-6">
                     <p className="text-[10px] font-bold tracking-widest text-slate-400">{expert.contributionsCount || 1} CONTRIBUTIONS</p>
                  </div>

                  <div className="flex gap-6">
                    {expert.twitter && (
                      <a href={expert.twitter.startsWith('@') ? `https://twitter.com/${expert.twitter.slice(1)}` : expert.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black transition-colors">
                        <Twitter size={18} />
                      </a>
                    )}
                    {expert.linkedin && (
                      <a href={expert.linkedin.startsWith('http') ? expert.linkedin : `https://linkedin.com/in/${expert.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black transition-colors">
                        <Linkedin size={18} />
                      </a>
                    )}
                    {expert.website && (
                      <a href={expert.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black transition-colors">
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
