"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ImageIcon, Box, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DownloadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canvasRef: any
  moleculeData: any
}

export function DownloadModal({ open, onOpenChange, canvasRef, moleculeData }: DownloadModalProps) {
  const [downloading, setDownloading] = useState(false)

  const downloadImage = async (format: string, quality = 1.0) => {
    if (!canvasRef.current || !moleculeData) {
      toast.error("No molecule to download")
      return
    }

    setDownloading(true)
    try {
      const dataURL = canvasRef.current.captureImage(format, quality)
      if (!dataURL) {
        throw new Error("Failed to capture image")
      }

      const link = document.createElement("a")
      // Use actual molecular formula or fallback to search term
      const actualFormula = moleculeData.educationalData?.basic_properties?.MolecularFormula ||
                           moleculeData.formula ||
                           "molecule"
      const cleanFormula = actualFormula.replace(/[^a-zA-Z0-9]/g, '_')
      const sizeLabel = quality === 1 ? '1200px' : '2400px'
      link.download = `moleXa_${cleanFormula}_${sizeLabel}.${format}`
      link.href = dataURL
      link.click()

      toast.success(`Downloaded ${format.toUpperCase()} image (${sizeLabel})`)
    } catch (error) {
      toast.error("Failed to download image")
      console.error('Download error:', error)
    } finally {
      setDownloading(false)
    }
  }

  const download3DModel = async (format: string) => {
    if (!moleculeData || !canvasRef.current) {
      toast.error("No molecule to download")
      return
    }

    setDownloading(true)
    try {
      // Extract enhanced scene data from Canvas3D
      const sceneData = canvasRef.current.getEnhancedSceneData()
      if (!sceneData) {
        toast.error("Could not extract 3D scene data")
        return
      }

      console.log('Scene data extracted:', sceneData)

      const actualFormula = sceneData.formula || "molecule"
      const cleanFormula = actualFormula.replace(/[^a-zA-Z0-9]/g, '_')

      if (format === "obj") {
        // Generate both OBJ and MTL files from scene
        const { objContent, mtlContent } = generateOBJFromScene(sceneData)
        
        // Download OBJ file
        const objBlob = new Blob([objContent], { type: "text/plain" })
        const objUrl = URL.createObjectURL(objBlob)
        const objLink = document.createElement("a")
        objLink.download = `moleXa_${cleanFormula}_scene.obj`
        objLink.href = objUrl
        objLink.click()
        URL.revokeObjectURL(objUrl)

        // Download MTL file
        const mtlBlob = new Blob([mtlContent], { type: "text/plain" })
        const mtlUrl = URL.createObjectURL(mtlBlob)
        const mtlLink = document.createElement("a")
        mtlLink.download = `moleXa_${cleanFormula}_scene.mtl`
        mtlLink.href = mtlUrl
        mtlLink.click()
        URL.revokeObjectURL(mtlUrl)

        toast.success("Downloaded OBJ and MTL files (from 3D scene)")
      } else {
        let content = ""
        if (format === "pdb") {
          content = generatePDBFromScene(sceneData)
        } else if (format === "sdf") {
          content = generateSDFFromScene(sceneData)
        }

        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = `moleXa_${cleanFormula}_scene.${format}`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)

        toast.success(`Downloaded ${format.toUpperCase()} file (from 3D scene)`)
      }
    } catch (error) {
      toast.error("Failed to download 3D model")
      console.error('3D Model download error:', error)
    } finally {
      setDownloading(false)
    }
  }

  // Generate sphere vertices and faces for atoms
  const generateSphere = (centerX: number, centerY: number, centerZ: number, radius: number, segments = 20) => {
    const vertices = []
    const faces = []

    // Generate vertices
    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat * Math.PI) / segments
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)

      for (let lon = 0; lon <= segments; lon++) {
        const phi = (lon * 2 * Math.PI) / segments
        const sinPhi = Math.sin(phi)
        const cosPhi = Math.cos(phi)

        const x = centerX + radius * sinTheta * cosPhi
        const y = centerY + radius * cosTheta
        const z = centerZ + radius * sinTheta * sinPhi

        vertices.push(`v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}`)
      }
    }

    // Generate faces
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const first = lat * (segments + 1) + lon + 1
        const second = first + segments + 1

        // Two triangles per quad
        faces.push(`f ${first} ${second} ${first + 1}`)
        faces.push(`f ${second} ${second + 1} ${first + 1}`)
      }
    }

    return { vertices, faces, vertexCount: vertices.length }
  }

  // Generate cylinder for bonds
  const generateCylinder = (startX: number, startY: number, startZ: number, 
                          endX: number, endY: number, endZ: number, 
                          radius: number, segments = 12) => {
    const vertices = []
    const faces = []
    
    // Calculate cylinder orientation
    const dx = endX - startX
    const dy = endY - startY
    const dz = endZ - startZ
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    if (length === 0) return { vertices: [], faces: [], vertexCount: 0 }
    
    // Normalize direction vector
    const dirX = dx / length
    const dirY = dy / length
    const dirZ = dz / length
    
    // Create perpendicular vectors
    let perpX, perpY, perpZ
    if (Math.abs(dirX) < 0.9) {
      perpX = 0; perpY = dirZ; perpZ = -dirY
    } else {
      perpX = -dirZ; perpY = 0; perpZ = dirX
    }
    
    // Normalize perpendicular vector
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ)
    perpX /= perpLength
    perpY /= perpLength
    perpZ /= perpLength
    
    // Create second perpendicular vector
    const perp2X = dirY * perpZ - dirZ * perpY
    const perp2Y = dirZ * perpX - dirX * perpZ
    const perp2Z = dirX * perpY - dirY * perpX
    
    // Generate vertices for both ends of cylinder
    for (let end = 0; end < 2; end++) {
      const centerX = end === 0 ? startX : endX
      const centerY = end === 0 ? startY : endY
      const centerZ = end === 0 ? startZ : endZ
      
      for (let i = 0; i <= segments; i++) {
        const angle = (2 * Math.PI * i) / segments
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        
        const x = centerX + radius * (cos * perpX + sin * perp2X)
        const y = centerY + radius * (cos * perpY + sin * perp2Y)
        const z = centerZ + radius * (cos * perpZ + sin * perp2Z)
        
        vertices.push(`v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}`)
      }
    }
    
    // Generate faces for cylinder sides
    for (let i = 0; i < segments; i++) {
      const bottomFirst = i + 1
      const bottomSecond = ((i + 1) % (segments + 1)) + 1
      const topFirst = segments + 1 + i + 1
      const topSecond = segments + 1 + ((i + 1) % (segments + 1)) + 1
      
      // Two triangles per quad
      faces.push(`f ${bottomFirst} ${topFirst} ${bottomSecond}`)
      faces.push(`f ${topFirst} ${topSecond} ${bottomSecond}`)
    }
    
    return { vertices, faces, vertexCount: vertices.length }
  }

  // Generate OBJ from enhanced scene data
  const generateOBJFromScene = (sceneData: any) => {
    const cleanFormula = sceneData.formula.replace(/[^a-zA-Z0-9]/g, '_')
    
    // Generate MTL content
    let mtlContent = `# moleXa Generated MTL File (from 3D Scene)\n`
    mtlContent += `# Molecule: ${sceneData.formula}\n`
    mtlContent += `# Generated on: ${new Date().toISOString()}\n`
    mtlContent += `# Extracted from: Three.js Scene with ${sceneData.atoms.length} atoms\n\n`
    
    // Create materials for each element
    Object.keys(sceneData.elements).forEach(element => {
      const elementInfo = sceneData.elements[element]
      const hex = elementInfo.color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      mtlContent += `newmtl ${element}\n`
      mtlContent += `Ka ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}\n` // Ambient color
      mtlContent += `Kd ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}\n` // Diffuse color
      mtlContent += `Ks 0.300 0.300 0.300\n` // Specular color
      mtlContent += `Ns 96.0\n` // Specular exponent
      mtlContent += `d 1.0\n` // Transparency
      mtlContent += `illum 2\n\n` // Illumination model
    })

    // Add material for bonds
    mtlContent += `newmtl bond_material\n`
    mtlContent += `Ka 0.400 0.400 0.400\n`
    mtlContent += `Kd 0.400 0.400 0.400\n`
    mtlContent += `Ks 0.200 0.200 0.200\n`
    mtlContent += `Ns 96.0\n`
    mtlContent += `d 1.0\n`
    mtlContent += `illum 2\n\n`

    // Generate OBJ content
    let objContent = "# moleXa Generated OBJ File (from 3D Scene)\n"
    objContent += `# Molecule: ${sceneData.formula}\n`
    objContent += `# Generated on: ${new Date().toISOString()}\n`
    objContent += `# Extracted from: Three.js Scene\n`
    objContent += `# Atoms: ${sceneData.atoms.length}, Bonds: ${sceneData.bonds?.length || 0}\n`
    objContent += `mtllib moleXa_${cleanFormula}_scene.mtl\n\n`

    let vertexCount = 0

    // Generate spheres for atoms using actual scene positions and sizes
    sceneData.atoms.forEach((atom: any, index: number) => {
      const [x, y, z] = atom.position
      const radius = atom.radius || 0.4

      objContent += `\n# Atom ${index + 1}: ${atom.element} at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})\n`
      objContent += `o atom_${atom.element}_${index + 1}\n`
      objContent += `usemtl ${atom.element}\n`

      const sphere = generateSphere(x, y, z, radius)
      
      // Add vertices
      sphere.vertices.forEach(vertex => {
        objContent += vertex + '\n'
      })
      
      // Add faces with proper vertex indexing
      sphere.faces.forEach(face => {
        const parts = face.split(' ')
        const adjustedFace = parts.map((part, i) => {
          if (i === 0) return part // 'f'
          return (parseInt(part) + vertexCount).toString()
        }).join(' ')
        objContent += adjustedFace + '\n'
      })
      
      vertexCount += sphere.vertexCount
    })

    // Generate cylinders for bonds
    if (sceneData.bonds && sceneData.bonds.length > 0) {
      const atomMap = new Map()
      sceneData.atoms.forEach((atom: any) => {
        atomMap.set(atom.id, atom)
      })

      sceneData.bonds.forEach((bond: any, index: number) => {
        const atom1 = atomMap.get(bond.atom1)
        const atom2 = atomMap.get(bond.atom2)
        if (!atom1 || !atom2) return

        const [x1, y1, z1] = atom1.position
        const [x2, y2, z2] = atom2.position
        const bondRadius = Math.min(atom1.radius || 0.4, atom2.radius || 0.4) * 0.15

        objContent += `\n# Bond ${index + 1}: ${atom1.element}-${atom2.element} (${bond.type})\n`
        objContent += `o bond_${bond.type}_${index + 1}\n`
        objContent += `usemtl bond_material\n`

        const cylinder = generateCylinder(x1, y1, z1, x2, y2, z2, bondRadius)
        
        // Add vertices
        cylinder.vertices.forEach(vertex => {
          objContent += vertex + '\n'
        })
        
        // Add faces with vertex offset
        cylinder.faces.forEach(face => {
          const parts = face.split(' ')
          const adjustedFace = parts.map((part, i) => {
            if (i === 0) return part // 'f'
            return (parseInt(part) + vertexCount).toString()
          }).join(' ')
          objContent += adjustedFace + '\n'
        })
        
        vertexCount += cylinder.vertexCount
      })
    }

    return { objContent, mtlContent }
  }

  // Generate PDB from scene data
  const generatePDBFromScene = (sceneData: any) => {
    let pdb = "HEADER    MOLECULE GENERATED BY MOLEXA (FROM 3D SCENE)\n"
    pdb += `TITLE     ${sceneData.formula}\n`
    pdb += `REMARK   Generated on ${new Date().toISOString()}\n`
    pdb += `REMARK   Extracted from Three.js scene with ${sceneData.atoms.length} atoms\n`
    pdb += `REMARK   Source: 3D molecular visualization scene\n`

    sceneData.atoms.forEach((atom: any, index: number) => {
      const [x, y, z] = atom.position
      const atomNum = (index + 1).toString().padStart(5)
      const atomName = atom.element.padEnd(4)
      const residueName = "MOL"
      const chainId = "A"
      const residueNum = "1".padStart(4)
      const xCoord = x.toFixed(3).padStart(8)
      const yCoord = y.toFixed(3).padStart(8)
      const zCoord = z.toFixed(3).padStart(8)
      const occupancy = "1.00"
      const tempFactor = "20.00"
      const element = atom.element.padEnd(2)

      pdb += `ATOM  ${atomNum} ${atomName} ${residueName} ${chainId}${residueNum}    ${xCoord}${yCoord}${zCoord}  ${occupancy} ${tempFactor}           ${element}\n`
    })

    // Add connectivity information
    if (sceneData.bonds) {
      sceneData.bonds.forEach((bond: any) => {
        const atom1Index = sceneData.atoms.findIndex((a: any) => a.id === bond.atom1) + 1
        const atom2Index = sceneData.atoms.findIndex((a: any) => a.id === bond.atom2) + 1
        if (atom1Index > 0 && atom2Index > 0) {
          pdb += `CONECT${atom1Index.toString().padStart(5)}${atom2Index.toString().padStart(5)}\n`
        }
      })
    }

    pdb += "END\n"
    return pdb
  }

  // Generate SDF from scene data
  const generateSDFFromScene = (sceneData: any) => {
    let sdf = `${sceneData.formula}\n`
    sdf += "  moleXa Generated (from 3D Scene)\n"
    sdf += `  Generated on ${new Date().toLocaleDateString()}\n`
    
    const atomCount = sceneData.atoms.length.toString().padStart(3)
    const bondCount = (sceneData.bonds?.length || 0).toString().padStart(3)
    sdf += `${atomCount}${bondCount}  0  0  0  0  0  0  0  0999 V2000\n`

    // Add atoms with actual scene positions
    sceneData.atoms.forEach((atom: any) => {
      const [x, y, z] = atom.position
      const xStr = x.toFixed(4).padStart(10)
      const yStr = y.toFixed(4).padStart(10)
      const zStr = z.toFixed(4).padStart(10)
      const element = atom.element.padEnd(3)
      sdf += `${xStr}${yStr}${zStr} ${element} 0  0  0  0  0  0  0  0  0  0  0  0\n`
    })

    // Add bonds
    if (sceneData.bonds) {
      sceneData.bonds.forEach((bond: any) => {
        const atom1Index = (sceneData.atoms.findIndex((a: any) => a.id === bond.atom1) + 1).toString().padStart(3)
        const atom2Index = (sceneData.atoms.findIndex((a: any) => a.id === bond.atom2) + 1).toString().padStart(3)
        const bondType = bond.type === "double" ? "2" : bond.type === "triple" ? "3" : "1"
        sdf += `${atom1Index}${atom2Index}  ${bondType}  0  0  0  0\n`
      })
    }

    sdf += "M  END\n$$$$\n"
    return sdf
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Formats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => downloadImage("png", 1)}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                PNG (1200px)
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage("png", 2)}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                PNG (2400px)
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage("jpg", 1)}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                JPG (1200px)
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage("jpg", 2)}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                JPG (2400px)
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage("webp", 1)}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                WebP (1200px)
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadImage("webp", 2)}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                WebP (2400px)
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Images are automatically centered with optimal padding around the molecule
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Box className="h-4 w-4" />
              3D Model Formats
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={() => download3DModel("obj")}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                OBJ + MTL (Wavefront)
              </Button>
              <Button
                variant="outline"
                onClick={() => download3DModel("pdb")}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                PDB (Protein Data Bank)
              </Button>
              <Button
                variant="outline"
                onClick={() => download3DModel("sdf")}
                disabled={downloading}
                className="justify-start"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                SDF (Structure Data File)
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              3D models are extracted directly from the displayed scene to match exactly what you see
            </p>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2 text-gray-700">Enhanced Downloads:</p>
            <div className="space-y-2">
              <div>
                <strong className="text-gray-600">Images:</strong> Automatically centered with optimal padding. 
                High-resolution options ensure crisp quality for presentations and publications.
              </div>
              <div>
                <strong className="text-gray-600">3D Models:</strong> Extracted directly from the Three.js scene 
                to match exactly what you see displayed, including accurate positions, sizes, and colors.
              </div>
              <div>
                <strong className="text-gray-600">File Formats:</strong> OBJ files include full geometry with 
                accurate colors (MTL), PDB files contain connectivity data, and SDF files preserve structure information.
              </div>
            </div>
          </div>

          {downloading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating download...</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Extracting data from 3D scene and preparing files
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}