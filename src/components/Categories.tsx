import { motion } from "motion/react";
import * as Icons from "lucide-react";
import { CATEGORIES } from "../constants";
import type { ElementType } from "react";
import { Link } from "react-router-dom";

type IconName = keyof typeof Icons;

export default function Categories() {
  return (
    <section className="py-20 px-6 md:px-12 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-editorial font-bold mb-4">Explore by Interest</h2>
          <div className="h-0.5 w-12 bg-brand-accent mx-auto" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 border-t border-l border-slate-200">
          {CATEGORIES.map((cat, idx) => {
            const Icon = Icons[cat.icon as IconName] as ElementType;
            return (
              <Link
                key={cat.name}
                to={`/category/${cat.name}`}
                className="bg-white border-r border-b border-slate-200 p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-slate-50 transition-all"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-6 text-slate-400 group-hover:text-brand-accent transition-colors">
                  {Icon && <Icon size={28} strokeWidth={1.5} />}
                </div>
                <span className="font-bold text-slate-900 mb-1">{cat.name}</span>
                <span className="editorial-label text-[9px]">Browse News</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
