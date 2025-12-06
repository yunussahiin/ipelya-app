"use client";

import { motion } from "framer-motion";
import { Heart, Lock, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { ValueProp, ValuePropsSectionProps } from "./types";

/**
 * Default value props
 */
const defaultValueProps: ValueProp[] = [
  {
    icon: <Heart className="h-8 w-8 text-[#FF2D92]" />,
    title: "Gerçek içerikler",
    description: "Creator'ların sansürsüz içeriklerini tek yerde keşfet."
  },
  {
    icon: <Lock className="h-8 w-8 text-[#5B8CFF]" />,
    title: "Güvenli ödeme",
    description: "Ödemelerin ve aboneliklerin güvenli şekilde yönetildiği sistem."
  },
  {
    icon: <Wallet className="h-8 w-8 text-amber-400" />,
    title: "Creator gelir modeli",
    description: "Creator'ların abonelik ve özel paketlerle gelir kazanabildiği yapı."
  }
];

/**
 * Value Props Section - 3 kutuluk grid
 */
export function ValuePropsSection({ items = defaultValueProps }: ValuePropsSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Neden İpelya?</h2>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-[#2A2A38] bg-[#101018] transition-all hover:border-[#FF2D92]/50 hover:shadow-[0_0_20px_rgba(255,45,146,0.15)]">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 rounded-full bg-white/5 p-4">{item.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-[#B5B5C0]">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
