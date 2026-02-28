import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const proofItems = [
  { num: "01", title: "Clinical Precision", desc: "10-axis scoring system based on IGA, TEWL and MASI clinical scales" },
  { num: "02", title: "Personalized Protocol", desc: "Phase 1–5 routine matched to your unique skin vector, not a generic type" },
  { num: "03", title: "Curated K-Beauty", desc: "Dermatologist-validated Korean formulas selected for European skin needs" },
];

const steps = [
  { step: "01", title: "Context Setup", time: "30 sec" },
  { step: "02", title: "Symptom Check", time: "3–5 min" },
  { step: "03", title: "Instant Analysis", time: "< 3 sec" },
  { step: "04", title: "Your Protocol", time: "Personalized" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto max-w-[960px] text-center">
          <motion.h1
            className="font-display text-5xl leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Your Skin.<br />
            <span className="text-gradient-cyan">Clinically Decoded.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            A dermatology-grade skin assessment.<br />
            Personalized K-beauty protocols.<br />
            Delivered to your door.
          </motion.p>

          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Link
              to="/diagnosis"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all glow-cyan hover:opacity-90"
            >
              Begin Your Skin Assessment
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.p
            className="mt-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            120 clinical markers · 8 patterns · 5-phase protocol
          </motion.p>
        </div>
      </section>

      {/* Proof Section */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-[960px] gap-12 md:grid-cols-3">
          {proofItems.map((item, i) => (
            <motion.div
              key={item.num}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
            >
              <span className="text-sm font-medium text-primary">{item.num}</span>
              <h3 className="mt-2 font-display text-2xl text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-[960px]">
          <h2 className="font-display text-3xl text-foreground">How It Works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="border-l border-border pl-4"
              >
                <span className="text-xs font-medium uppercase tracking-widest text-primary">Step {s.step}</span>
                <h4 className="mt-2 font-display text-lg text-foreground">{s.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{s.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
