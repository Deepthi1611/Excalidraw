import { Pencil, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import heroCanvas from "@/assets/hero-canvas.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden canvas-dots">
      {/* Floating sketchy decorations */}
      <svg className="absolute top-20 left-10 w-16 h-16 text-sketch-orange opacity-40 animate-float" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="32" cy="32" r="28" strokeDasharray="6 4" />
      </svg>
      <svg className="absolute top-40 right-16 w-12 h-12 text-sketch-blue opacity-30 animate-float" style={{ animationDelay: "1s" }} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="6" width="36" height="36" rx="2" strokeDasharray="5 3" />
      </svg>
      <svg className="absolute bottom-32 left-20 w-10 h-10 text-sketch-green opacity-30 animate-float" style={{ animationDelay: "2s" }} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="20,4 36,36 4,36" strokeDasharray="4 3" />
      </svg>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sketch-orange/15 border border-sketch-orange/30 text-secondary-foreground text-sm font-semibold mb-8 sketch-shadow">
          <Pencil className="w-4 h-4 text-sketch-orange" />
          <span>Open-source whiteboard for everyone</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Sketch your ideas,{" "}
          <span className="font-sketch text-primary">together</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          A virtual whiteboard that lets you draw diagrams, wireframes, and anything you can imagine — collaboratively, in real time.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" className="text-xl px-8 py-6 rounded-xl sketch-shadow font-extrabold">
            <span className="font-sketch">Start Drawing</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-xl px-8 py-6 rounded-xl font-extrabold transition-colors hover:!bg-orange-500 hover:!text-white hover:!border-orange-500"
          >
            <span className="font-sketch">View on GitHub</span>
          </Button>
        </div>

        {/* Quick feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: Zap, label: "Instant & fast", color: "text-sketch-orange" },
            { icon: Users, label: "Real-time collab", color: "text-sketch-blue" },
            { icon: Pencil, label: "Hand-drawn feel", color: "text-sketch-green" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border text-sm font-medium">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Hero image */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-border sketch-shadow max-w-4xl mx-auto">
          <Image
            src={heroCanvas}
            alt="Excalidraw canvas showing collaborative drawings and diagrams"
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
