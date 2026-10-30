import { Component, createSignal } from "solid-js";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { InteractiveSimulator } from "./components/InteractiveSimulator";
import { FeatureGrid } from "./components/FeatureGrid";
import { SolutionsSection } from "./components/SolutionsSection";
import { DocsSection } from "./components/DocsSection";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { BookDemoModal } from "./components/BookDemoModal";

export const App: Component = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = createSignal(false);

  const scrollToDemo = () => {
    const el = document.getElementById("demo-preview");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sticky Top Navbar */}
      <Navbar onOpenDemo={() => setIsDemoModalOpen(true)} />

      {/* Hero Section */}
      <Hero
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onScrollToDemo={scrollToDemo}
      />

      {/* Live Interactive POS Simulator */}
      <InteractiveSimulator />

      {/* Feature Grid */}
      <FeatureGrid />

      {/* Vertical Solutions (Kirana, Supermarket, Pharmacy, Retail) */}
      <SolutionsSection />

      {/* Documentation & Developer Reference */}
      <DocsSection />

      {/* Pricing Plans */}
      <Pricing onOpenDemo={() => setIsDemoModalOpen(true)} />

      {/* Frequently Asked Questions */}
      <FAQ />

      {/* Global Footer */}
      <Footer />

      {/* Book a Demo Modal */}
      <BookDemoModal
        isOpen={isDemoModalOpen()}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};
