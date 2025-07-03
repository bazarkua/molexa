import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FlaskConical, Database, Atom, Zap } from "lucide-react"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            About MoleculeScan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">
            MoleculeScan is a modern web application that fetches live molecular data from the PubChem database and
            renders scientifically accurate 3D molecular structures with proper bonding geometry.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Data Source
              </h3>
              <p className="text-sm text-gray-600">
                All molecular data is sourced from the PubChem database, maintained by the National Center for
                Biotechnology Information (NCBI). This ensures accurate and up-to-date chemical information.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Atom className="h-5 w-5 text-blue-500" />
                3D Visualization
              </h3>
              <p className="text-sm text-gray-600">
                Molecules are rendered using Three.js with scientifically accurate atomic radii, bond lengths, and
                angles. Materials use physically-based rendering for realistic appearance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Features
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Real-time molecular data fetching from PubChem API</li>
              <li>• Interactive 3D visualization with mouse controls</li>
              <li>• Search by molecule name or chemical formula</li>
              <li>• Curated sample molecules across different categories</li>
              <li>• Responsive design optimized for desktop and mobile</li>
              <li>• Scientifically accurate atomic colors and bond representations</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Built with Next.js, Three.js, and Tailwind CSS. Data provided by PubChem Database.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
