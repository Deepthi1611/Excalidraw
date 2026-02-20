import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="border-t py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* CTA band */}
        <div className="text-center mb-16 py-12 px-6 rounded-2xl bg-primary/5 canvas-dots">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to start drawing?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            No account needed. Just open and sketch.
          </p>
          <Button size="lg" className="text-lg px-8 py-6 rounded-xl sketch-shadow font-bold">
            <span className="font-sketch text-xl">Open Canvas</span>
          </Button>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Pencil className="w-5 h-5 text-primary" />
            <span className="font-sketch text-lg">Sketchy</span>
          </div>
          <p>Open source · Built with ❤️</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
