import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="mx-auto max-w-[960px] px-6 pt-24 pb-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">About</p>
      <h1 className="mt-3 font-display text-4xl text-foreground">Skin Strategy Lab</h1>
      <div className="mt-8 max-w-2xl space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Skin Strategy Lab is a clinical skin diagnosis platform that combines dermatology-grade
          assessment methodology with curated K-beauty protocols.
        </p>
        <p>
          Our 10-axis scoring engine evaluates 120 clinical markers across 8 symptom categories,
          detecting high-risk patterns that inform a personalized 5-phase skincare routine.
        </p>
        <p>
          Every product recommendation is mapped to your unique skin vector — not a generic skin type.
          We select dermatologist-validated Korean formulas specifically suited for European skin needs.
        </p>
        <p className="text-sm text-muted-foreground">
          This platform is for informational purposes only and does not replace professional
          dermatological advice.
        </p>
      </div>
    </div>
    <Footer />
  </div>
);

export default About;
