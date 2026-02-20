import { Pencil, Users, Share2, Lock, Layers, Palette } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionIntro } from "@/components/ui/section-intro";

const features = [
  {
    icon: Pencil,
    title: "Hand-drawn style",
    description: "Beautiful sketchy aesthetic that makes your diagrams feel human and approachable.",
    color: "text-sketch-orange",
    bg: "bg-sketch-orange/10",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    description: "Work together with your team — see cursors, edits, and changes live.",
    color: "text-sketch-blue",
    bg: "bg-sketch-blue/10",
  },
  {
    icon: Share2,
    title: "Easy sharing",
    description: "Share a link and anyone can view or edit. No signup required.",
    color: "text-sketch-green",
    bg: "bg-sketch-green/10",
  },
  {
    icon: Lock,
    title: "End-to-end encrypted",
    description: "Your drawings stay private. We never see your data.",
    color: "text-sketch-purple",
    bg: "bg-sketch-purple/10",
  },
  {
    icon: Layers,
    title: "Infinite canvas",
    description: "Pan, zoom, and organize freely. No boundaries on your creativity.",
    color: "text-sketch-blue",
    bg: "bg-sketch-blue/10",
  },
  {
    icon: Palette,
    title: "Rich library",
    description: "Shapes, arrows, text, and images — everything you need to express ideas.",
    color: "text-sketch-orange",
    bg: "bg-sketch-orange/10",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-6">
      <Container size="xl">
        <SectionIntro
          className="mb-16"
          title={
            <>
              Everything you need to <span className="font-sketch text-primary">sketch</span>
            </>
          }
          description="Simple, powerful tools that get out of your way so you can focus on ideas."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              iconBgClassName={feature.bg}
              iconColorClassName={feature.color}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Features;
