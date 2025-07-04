import { Code, User, FlaskConical, ExternalLink, BookOpen, Database, Link, Globe, Zap } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Image
                  src="/mox_logo.png"
                  alt="moleXa logo"
                  width={120}
                  height={120}
                  className="object-cover"
                  priority
                />
              </div>
              <h3 className="text-xl font-light">moleXa</h3>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              A modern web application for 3D molecular visualization using scientifically accurate data from PubChem.
              Built for educational purposes to help students and researchers explore molecular structures.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BookOpen className="h-4 w-4" />
              <span>Educational Use Only</span>
            </div>
          </div>

          {/* Technology Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Technology Stack</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Next.js & React for frontend</li>
              <li>• Three.js for 3D rendering</li>
              <li>• TypeScript for type safety</li>
              <li>• Tailwind CSS for styling</li>
              <li>• Node.js API backend</li>
              <li>• PubChem REST API integration</li>
            </ul>
          </div>

          {/* API Integration Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Link className="h-5 w-5" />
              API Integration
            </h3>
            <p className="text-gray-300 mb-4">
              Frontend connects to our educational proxy API for enhanced molecular data access with CORS support and educational enhancements.
            </p>
            <div className="space-y-2">
              <a
                href="https://molexa-api.vercel.app/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                <Globe className="h-4 w-4" />
                API Base URL
                <ExternalLink className="h-3 w-3" />
              </a>
              <br />
              <a
                href="https://molexa-api.vercel.app/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                <BookOpen className="h-4 w-4" />
                API Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        {/* Data Source Section */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Source
              </h3>
              <p className="text-gray-300 mb-4">
                All molecular data is sourced from the PubChem database, maintained by the National Center for
                Biotechnology Information (NCBI). Our API enhances this data with educational context.
              </p>
              <a
                href="https://pubchem.ncbi.nlm.nih.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Visit PubChem Database
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                API Features
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• CORS-enabled for web applications</li>
                <li>• Educational context and explanations</li>
                <li>• Intelligent rate limiting (5 req/sec)</li>
                <li>• Response caching for performance</li>
                <li>• Real-time usage analytics</li>
                <li>• Safety and toxicity information</li>
                <li>• Enhanced error handling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PubChem Citation Section */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <h3 className="text-lg font-medium mb-4">PubChem Citation</h3>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-300 mb-4">
              If you use data from this application, please cite PubChem using the following reference:
            </p>
            <blockquote className="border-l-4 border-blue-500 pl-4 text-sm text-gray-200 font-mono leading-relaxed">
              Kim, S., Chen, J., Cheng, T., Gindulyte, A., He, J., He, S., Li, Q., Shoemaker, B. A., Thiessen, P. A.,
              Yu, B., Zaslavsky, L., Zhang, J., & Bolton, E. E. (2025). PubChem 2025 update. Nucleic Acids Res., 53(D1),
              D1516–D1525. https://doi.org/10.1093/nar/gkae1059
            </blockquote>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
              <a
                href="https://doi.org/10.1093/nar/gkae1059"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                DOI: 10.1093/nar/gkae1059
              </a>
              <span>PMID: 39558165</span>
              <span>PMCID: PMC11701573</span>
            </div>
          </div>
        </div>

        {/* Software Citation Section */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <h3 className="text-lg font-medium mb-4">Software Citations</h3>
          <div className="space-y-6">
            
            {/* moleXa Frontend Citation */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-medium text-gray-200 mb-3">moleXa Frontend Application</h4>
              <p className="text-sm text-gray-300 mb-4">
                If you use this molecular visualization application, please cite:
              </p>
              <blockquote className="border-l-4 border-green-500 pl-4 text-sm text-gray-200 font-mono leading-relaxed">
                Bazarkulov, A. (2025). <em>moleXa: 3D Molecular Visualization Platform</em> (Version 2.0.0) [Computer software]. 
                GitHub. https://github.com/bazarkua/molexa
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                <a
                  href="https://github.com/bazarkua/molexa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors"
                >
                  GitHub Repository
                </a>
                <a
                  href="https://molexa.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors"
                >
                  Live Application: molexa.org
                </a>
              </div>
            </div>

            {/* moleXa API Citation */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-medium text-gray-200 mb-3">moleXa Educational API</h4>
              <p className="text-sm text-gray-300 mb-4">
                If you use the educational proxy API, please cite:
              </p>
              <blockquote className="border-l-4 border-purple-500 pl-4 text-sm text-gray-200 font-mono leading-relaxed">
                Bazarkulov, A. (2025). <em>moleXa API: PubChem Educational Proxy API</em> (Version 2.2.0) [Computer software]. 
                GitHub. https://github.com/bazarkua/molexa-api
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                <a
                  href="https://github.com/bazarkua/molexa-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors"
                >
                  GitHub Repository
                </a>
                <a
                  href="https://molexa-api.vercel.app/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors"
                >
                  API Documentation
                </a>
                <a
                  href="https://molexa-api.vercel.app/api/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors"
                >
                  Live Analytics Dashboard
                </a>
              </div>
            </div>

            {/* Development Acknowledgment */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-medium text-gray-200 mb-3">Development Acknowledgment</h4>
              <p className="text-sm text-gray-300">
                This educational molecular visualization platform was developed by{" "}
                <strong className="text-gray-100">Adilbek Bazarkulov</strong> with assistance from{" "}
                <strong className="text-gray-100">Claude AI (Anthropic)</strong> for architecture design, 
                code optimization, and educational feature enhancement. The project aims to make molecular 
                chemistry more accessible for educational purposes.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>Built with Next.js, Three.js, and modern web technologies</span>
                <span>Enhanced with AI-assisted development</span>
                <span>Open source under MIT License</span>
              </div>
            </div>

          </div>
        </div>

        {/* Additional Citations */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <h3 className="text-lg font-medium mb-4">Additional PubChem Resources</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-200 mb-2">PUG-REST API</h4>
              <p className="text-gray-400 mb-2">
                Kim S, Thiessen PA, Cheng T, Yu B, Bolton EE. An update on PUG-REST: RESTful interface for programmatic
                access to PubChem. Nucleic Acids Res. 2018 July 2; 46(W1):W563-570.
              </p>
              <a
                href="https://doi.org/10.1093/nar/gky294"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                DOI: 10.1093/nar/gky294
              </a>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-2">PubChem3D</h4>
              <p className="text-gray-400 mb-2">
                Bolton EE, Chen J, Kim S, et al. PubChem3D: A new resource for scientists. J Cheminform. 2011 Sep 20;
                3(1):32.
              </p>
              <a
                href="https://doi.org/10.1186/1758-2946-3-32"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                DOI: 10.1186/1758-2946-3-32
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4" />© 2025 moleXa · MIT License
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Created by Adilbek Bazarkulov
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3" />
              <span>Data from PubChem Database via moleXa API</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}