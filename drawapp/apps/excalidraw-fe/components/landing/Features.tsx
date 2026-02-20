import { Pencil, Users, Share2, Lock, Layers, Palette } from "lucide-react";

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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Everything you need to <span className="font-sketch text-primary">sketch</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Simple, powerful tools that get out of your way so you can focus on ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-4xl border border-[#d6dbe5] bg-[#f7f8fb] shadow-[0_2px_0_rgba(148,163,184,0.14)] hover:shadow-[8px_10px_0_rgba(148,163,184,0.22)] transition-[box-shadow,border-color,background-color,transform] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:border-[#c9cfdb] hover:bg-[#f9fafc]"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
