import { Droplets, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl water-gradient flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                Ponce Hydrology Lab
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Interactive tools for understanding hydrology and hydraulics, inspired by the pioneering work of Prof. Victor Miguel Ponce.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <a
                  href="https://ponce.sdsu.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
                >
                  Ponce SDSU Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://ponce.sdsu.edu/380nutshells.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
                >
                  Concepts in a Nutshell
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://ponce.sdsu.edu/textbooks.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
                >
                  Online Textbooks
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Attribution */}
          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              This educational tool is inspired by the extensive web-based hydrology resources created by{" "}
              <span className="text-primary-foreground">Prof. Victor Miguel Ponce</span> at San Diego State University.
            </p>
            <p className="text-xs text-primary-foreground/50 mt-4">
              Not affiliated with SDSU. For educational purposes only.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} Ponce Hydrology Lab. Promoting water science education.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
