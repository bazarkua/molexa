"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import * as THREE from "three"
import { useMoleculeStore } from "@/lib/store"
import { MousePointer2, RotateCcw, ZoomIn } from "lucide-react"
import Image from "next/image"

// Type definitions for better IDE support
interface AtomData {
  id: string
  element: string
  position: [number, number, number]
}

interface BondData {
  atom1: string
  atom2: string
  type: "single" | "double" | "triple"
}

interface MoleculeData {
  formula: string
  elements: Record<string, { radius: number; color: string }>
  atoms: AtomData[]
  bonds: BondData[]
}

// Custom orbit controls implementation to avoid ESM import issues
class SimpleOrbitControls {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private target: THREE.Vector3
  private spherical: THREE.Spherical
  private sphericalDelta: THREE.Spherical
  private scale: number
  private zoomSpeed: number
  private rotateSpeed: number
  private enableDamping: boolean
  private dampingFactor: number
  private minDistance: number
  private maxDistance: number
  private isMouseDown: boolean
  private mouseButtons: { LEFT: number; MIDDLE: number; RIGHT: number }

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
    this.target = new THREE.Vector3()
    this.spherical = new THREE.Spherical()
    this.sphericalDelta = new THREE.Spherical()
    this.scale = 1
    this.zoomSpeed = 1.0
    this.rotateSpeed = 1.0
    this.enableDamping = true
    this.dampingFactor = 0.05
    this.minDistance = 3
    this.maxDistance = 50
    this.isMouseDown = false
    this.mouseButtons = { LEFT: 0, MIDDLE: 1, RIGHT: 2 }

    this.setupEventListeners()
    this.update()
  }

   private isPointerOver: boolean = false
   private setupEventListeners() {
    // track enter/leave on the canvas
    this.domElement.addEventListener("mouseenter", () => {
      this.isPointerOver = true
    })
    this.domElement.addEventListener("mouseleave", () => {
      this.isPointerOver = false
    })

    // still listen for mouse drag etc. on the canvas
    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this))
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this))
    this.domElement.addEventListener("mouseup",   this.onMouseUp.bind(this))
    this.domElement.addEventListener("contextmenu", this.onContextMenu.bind(this))
    this.domElement.style.cursor = "grab"

    // **global wheel listener** so page scroll works everywhere
    window.addEventListener("wheel", this.onMouseWheel.bind(this), { passive: false })
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button === this.mouseButtons.LEFT) {
      this.isMouseDown = true
      this.domElement.style.cursor = "grabbing"
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isMouseDown) return

    const movementX = event.movementX || 0
    const movementY = event.movementY || 0

    this.sphericalDelta.theta -= ((2 * Math.PI * movementX) / this.domElement.clientHeight) * this.rotateSpeed
    this.sphericalDelta.phi -= ((2 * Math.PI * movementY) / this.domElement.clientHeight) * this.rotateSpeed
  }

  private onMouseUp() {
    this.isMouseDown = false
    this.domElement.style.cursor = "grab"
  }

  private onMouseWheel(event: WheelEvent) {
    // 1) only consider events when pointer is over our canvas…
    if (!this.isPointerOver) {
      return  // let the browser scroll the page
    }

    // 2) …and only when Ctrl is held
    if (!event.ctrlKey) {
      return  // again: page scroll
    }

    // 3) otherwise intercept and zoom
    event.preventDefault()
    if (event.deltaY < 0) {
      this.scale /= Math.pow(0.95, this.zoomSpeed)
    } else if (event.deltaY > 0) {
      this.scale *= Math.pow(0.95, this.zoomSpeed)
    }
  }

  private onContextMenu(event: Event) {
    event.preventDefault()
  }

  update() {
    const offset = new THREE.Vector3()
    offset.copy(this.camera.position).sub(this.target)

    this.spherical.setFromVector3(offset)
    this.spherical.theta += this.sphericalDelta.theta
    this.spherical.phi += this.sphericalDelta.phi

    // Restrict phi to be between desired limits
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi))

    this.spherical.radius *= this.scale
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius))

    offset.setFromSpherical(this.spherical)
    this.camera.position.copy(this.target).add(offset)
    this.camera.lookAt(this.target)

    if (this.enableDamping) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor
      this.sphericalDelta.phi *= 1 - this.dampingFactor
    } else {
      this.sphericalDelta.set(0, 0, 0)
    }

    this.scale = 1
  }

  dispose() {
    this.domElement.removeEventListener("mousedown", this.onMouseDown.bind(this))
    this.domElement.removeEventListener("mousemove", this.onMouseMove.bind(this))
    this.domElement.removeEventListener("mouseup", this.onMouseUp.bind(this))
    this.domElement.removeEventListener("wheel", this.onMouseWheel.bind(this))
    this.domElement.removeEventListener("contextmenu", this.onContextMenu.bind(this))
  }
}

export const Canvas3D = forwardRef<any, {}>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<SimpleOrbitControls | null>(null)
  const moleculeGroupRef = useRef<THREE.Group | null>(null)
  const frameId = useRef<number | null>(null)

  const { moleculeData, showLabels } = useMoleculeStore()

  useImperativeHandle(ref, () => ({
    captureImage: (format: string, quality = 1.0) => {
      if (!rendererRef.current) return null

      // Render at higher resolution for better quality screenshots
      const originalSize = rendererRef.current.getSize(new THREE.Vector2())
      const scaleFactor = quality * 2 // Always double resolution for screenshots

      rendererRef.current.setSize(originalSize.x * scaleFactor, originalSize.y * scaleFactor, false)

      if (sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }

      const dataURL = rendererRef.current.domElement.toDataURL(`image/${format}`, 1.0)

      // Restore original size
      rendererRef.current.setSize(originalSize.x, originalSize.y, true)

      return dataURL
    },
    getScene: () => sceneRef.current,
    getRenderer: () => rendererRef.current,
    getMoleculeGroup: () => moleculeGroupRef.current,
    getMoleculeData: () => moleculeData,
    // Extract enhanced scene data for downloads
    getEnhancedSceneData: () => {
      if (!moleculeData || !moleculeGroupRef.current) return null
      
      // Extract actual positions from the rendered scene
      const enhancedAtoms = moleculeData.atoms.map((atom, index) => {
        // Find the corresponding sphere in the scene
        let scenePosition = atom.position
        
        // Try to get actual position from Three.js objects
        moleculeGroupRef.current?.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.userData?.atomIndex === index) {
            scenePosition = [child.position.x, child.position.y, child.position.z]
          }
        })
        
        const elementInfo = moleculeData.elements[atom.element]
        return {
          ...atom,
          position: scenePosition,
          radius: elementInfo?.radius * 0.8 || 0.4, // Match the scaling in renderMolecule
          color: elementInfo?.color || "#808080"
        }
      })

      return {
        ...moleculeData,
        atoms: enhancedAtoms,
        sceneInfo: {
          extractedFrom: 'Three.js Scene',
          timestamp: new Date().toISOString(),
          atomCount: enhancedAtoms.length,
          bondCount: moleculeData.bonds?.length || 0
        }
      }
    }
  }))

  const initializeScene = () => {
    const currentMount = mountRef.current
    if (!currentMount) return

    // Scene setup with light grey background to match target style
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5) // Light grey background

    // Camera setup with proper aspect ratio
    const camera = new THREE.PerspectiveCamera(
      50, // Slightly narrower FOV for better molecule framing
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 0, 15) // Start further back

    // High-quality renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // Required for screenshots
      alpha: false, // Opaque background for better performance
    })
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Lighting setup for professional molecular visualization
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Main directional light for primary shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Two rim lights for soft highlights (as requested)
    const rimLight1 = new THREE.PointLight(0xffffff, 0.4, 100)
    rimLight1.position.set(-8, 8, 8)
    scene.add(rimLight1)

    const rimLight2 = new THREE.PointLight(0xffffff, 0.3, 100)
    rimLight2.position.set(8, -8, -8)
    scene.add(rimLight2)

    // Custom orbit controls setup for proper molecule-centered rotation
    const controls = new SimpleOrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 3
    controls.maxDistance = 50

    currentMount.appendChild(renderer.domElement)

    // Store references
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera
    controlsRef.current = controls

    // Animation loop
    const animate = () => {
      frameId.current = requestAnimationFrame(animate)

      if (controls) {
        controls.update() // Required for damping
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }
    animate()
  }

  /**
   * Creates high-quality text sprites for atom labels
   * - Uses higher resolution canvas for crisp text
   * - Positions labels slightly forward to avoid clipping into spheres
   */
  const createAtomLabel = (text: string, atomRadius: number, textColor = "rgb(255, 255, 255)"): THREE.Sprite => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")!

    // High resolution for crisp text
    const size = 512
    canvas.width = size
    canvas.height = size

    const fontSize = 180 // Large font for high-res canvas
    context.font = `bold ${fontSize}px Inter, Arial, sans-serif`
    context.fillStyle = textColor
    context.strokeStyle = "rgba(255,255,255,0.8)"
    context.lineWidth = 8
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"

    // White outline for better contrast
    context.strokeText(text, size / 2, size / 2)
    context.fillText(text, size / 2, size / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // Always render on top
      depthWrite: false,
    })

    const sprite = new THREE.Sprite(spriteMaterial)
    const scale = atomRadius * 1.2 // Scale relative to atom size
    sprite.scale.set(scale, scale, scale)

    // Position slightly forward to avoid clipping into spheres
    sprite.position.z += atomRadius * 0.1

    return sprite
  }

  /**
   * Calculates adaptive spacing factor for dense molecules
   * - Prevents atom overlap in large structures
   * - Scales based on atom count with reasonable bounds
   */
  const calculateSpacingFactor = (atomCount: number): number => {
    // Base formula: more atoms = more spacing needed
    const baseFactor = 1 + atomCount / 500
    // Clamp between 1.0 (no scaling) and 1.8 (80% larger)
    return Math.max(1.0, Math.min(1.8, baseFactor))
  }

  /**
   * Creates bond geometry with support for double/triple bonds
   * - Single bonds: one cylinder
   * - Double bonds: two parallel cylinders
   * - Triple bonds: three parallel cylinders
   * - Bond radius is 13% of smaller connected atom (good balance of visibility/realism)
   */
  const createBondGeometry = (
    start: THREE.Vector3,
    end: THREE.Vector3,
    bondType: "single" | "double" | "triple",
    atom1Radius: number,
    atom2Radius: number,
  ): THREE.Mesh[] => {
    const bondMeshes: THREE.Mesh[] = []

    // Calculate bond properties
    const direction = new THREE.Vector3().subVectors(end, start)
    const distance = direction.length()
    const minAtomRadius = Math.min(atom1Radius, atom2Radius)
    const bondRadius = minAtomRadius * 0.13 // 13% of smaller atom radius


    const lengthMultiplier = bondType === "double"
    ? 1.4
    : bondType === "triple"
        ? 1.6
      : 1.2

    // Adjust bond length to go from surface to surface, not center to center
    const surfaceDistance = distance - atom1Radius - atom2Radius
    const adjustedStart = start.clone().add(direction.clone().normalize().multiplyScalar(atom1Radius))
    const adjustedEnd = end.clone().sub(direction.clone().normalize().multiplyScalar(atom2Radius))


    const adjustedDistance = surfaceDistance * lengthMultiplier
    

    // Bond material - consistent grey as shown in target image
    const bondMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666, // Medium grey for good contrast
      roughness: 0.3,
      metalness: 0.1,
    })

   

    if (bondType === "single") {
      // Single bond: one cylinder
      const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, adjustedDistance, 16)
      const mesh = new THREE.Mesh(geometry, bondMaterial)

      // Position and orient the cylinder
      mesh.position.copy(adjustedStart).add(adjustedEnd).divideScalar(2)
      mesh.lookAt(adjustedEnd)
      mesh.rotateX(Math.PI / 2)

      bondMeshes.push(mesh)
    } else if (bondType === "double") {
      // Double bond: two parallel cylinders
      const geometry = new THREE.CylinderGeometry(bondRadius * 0.8, bondRadius * 0.8, adjustedDistance, 12)

      // Calculate perpendicular offset vector
      const axis = direction.clone().normalize()
      const perpendicular = new THREE.Vector3(0, 0, 1)
      if (Math.abs(axis.dot(perpendicular)) > 0.9) {
        perpendicular.set(1, 0, 0) // Use different axis if parallel
      }
      const offset = perpendicular
        .cross(axis)
        .normalize()
        .multiplyScalar(bondRadius * 1.5)

      // Create two offset cylinders
      for (let i = 0; i < 2; i++) {
        const mesh = new THREE.Mesh(geometry, bondMaterial.clone())
        const sign = i === 0 ? 1 : -1
        const centerPos = adjustedStart.clone().add(adjustedEnd).divideScalar(2)

        mesh.position.copy(centerPos).add(offset.clone().multiplyScalar(sign))
        mesh.lookAt(adjustedEnd.clone().add(offset.clone().multiplyScalar(sign)))
        mesh.rotateX(Math.PI / 2)

        bondMeshes.push(mesh)
      }
    } else if (bondType === "triple") {
      // Triple bond: three parallel cylinders
      const geometry = new THREE.CylinderGeometry(bondRadius * 0.7, bondRadius * 0.7, adjustedDistance, 12)

      // Calculate two perpendicular offset vectors
      const axis = direction.clone().normalize()
      const perpendicular1 = new THREE.Vector3(0, 0, 1)
      if (Math.abs(axis.dot(perpendicular1)) > 0.9) {
        perpendicular1.set(1, 0, 0)
      }
      const offset1 = perpendicular1
        .cross(axis)
        .normalize()
        .multiplyScalar(bondRadius * 1.8)
      const offset2 = axis
        .clone()
        .cross(offset1)
        .normalize()
        .multiplyScalar(bondRadius * 1.8)

      // Center cylinder
      const centerMesh = new THREE.Mesh(geometry, bondMaterial.clone())
      centerMesh.position.copy(adjustedStart).add(adjustedEnd).divideScalar(2)
      centerMesh.lookAt(adjustedEnd)
      centerMesh.rotateX(Math.PI / 2)
      bondMeshes.push(centerMesh)

      // Two offset cylinders
      for (let i = 0; i < 2; i++) {
        const mesh = new THREE.Mesh(geometry, bondMaterial.clone())
        const sign = i === 0 ? 1 : -1
        const centerPos = adjustedStart.clone().add(adjustedEnd).divideScalar(2)

        mesh.position.copy(centerPos).add(offset1.clone().multiplyScalar(sign))
        mesh.lookAt(adjustedEnd.clone().add(offset1.clone().multiplyScalar(sign)))
        mesh.rotateX(Math.PI / 2)

        bondMeshes.push(mesh)
      }
    }

    // Enable shadows for all bond meshes
    bondMeshes.forEach((mesh) => {
      mesh.castShadow = true
      mesh.receiveShadow = true
    })

    return bondMeshes
  }

  /**
   * Clears all molecule-related objects from the scene
   * - Properly disposes of geometries and materials to prevent memory leaks
   * - Removes the molecule group entirely
   */
  const clearScene = () => {
    if (!sceneRef.current || !moleculeGroupRef.current) return

    // Dispose of all geometries and materials
    moleculeGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      }
      if (child instanceof THREE.Sprite && child.material) {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    })

    sceneRef.current.remove(moleculeGroupRef.current)
    moleculeGroupRef.current = null
  }

  /**
   * Main molecule rendering function
   * - Creates a grouped molecule that rotates around its own center
   * - Applies adaptive spacing for dense structures
   * - Renders atoms as solid spheres and bonds with proper multiplicity
   */
  const renderMolecule = (data: MoleculeData) => {
    if (!sceneRef.current) return

    clearScene()

    // Create a new group for the entire molecule
    const moleculeGroup = new THREE.Group()
    const atomMap = new Map<string, AtomData>()

    // Calculate adaptive spacing factor
    const spacingFactor = calculateSpacingFactor(data.atoms.length)
    console.log(`Rendering ${data.atoms.length} atoms with spacing factor: ${spacingFactor.toFixed(2)}`)

    // Create atoms as solid spheres
    data.atoms.forEach((atom, index) => {
      const elementInfo = data.elements[atom.element]
      if (!elementInfo) return

      const color = Number.parseInt(elementInfo.color.replace("#", "0x"))
      const radius = elementInfo.radius * 0.8 // Slightly smaller for better proportions

      // Apply spacing factor to coordinates
      const [x, y, z] = atom.position.map((coord) => coord * spacingFactor)

      // High-quality sphere geometry (64 segments for smooth appearance)
      const geometry = new THREE.SphereGeometry(radius, 64, 64)
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2, // Slightly shiny for professional look
        metalness: 0.0, // Non-metallic
      })

      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(x, y, z)
      sphere.castShadow = true
      sphere.receiveShadow = true
      
      // Store atom index for later reference
      sphere.userData = { atomIndex: index, atomId: atom.id, element: atom.element }

      moleculeGroup.add(sphere)
      atomMap.set(atom.id, { ...atom, position: [x, y, z] })

      // Add label if enabled
      if (showLabels) {
        const label = createAtomLabel(atom.element, radius)
        label.position.set(x, y, z + radius * 0.1) // Slightly forward
        moleculeGroup.add(label)
      }
    })

    // Create bonds with proper multiplicity
    data.bonds.forEach((bond) => {
      const atom1 = atomMap.get(bond.atom1)
      const atom2 = atomMap.get(bond.atom2)
      if (!atom1 || !atom2) return

      const start = new THREE.Vector3(...atom1.position)
      const end = new THREE.Vector3(...atom2.position)
      const atom1Radius = data.elements[atom1.element]?.radius * 0.8 || 0.4
      const atom2Radius = data.elements[atom2.element]?.radius * 0.8 || 0.4

      const bondMeshes = createBondGeometry(start, end, bond.type, atom1Radius, atom2Radius)
      bondMeshes.forEach((mesh) => {
        mesh.userData = { bondType: bond.type, atom1: bond.atom1, atom2: bond.atom2 }
        moleculeGroup.add(mesh)
      })
    })

    // Center the molecule group at origin
    const box = new THREE.Box3().setFromObject(moleculeGroup)
    const center = box.getCenter(new THREE.Vector3())
    moleculeGroup.position.sub(center)

    // Add the group to the scene
    sceneRef.current.add(moleculeGroup)
    moleculeGroupRef.current = moleculeGroup

    // Update camera and controls to focus on the molecule
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // Position camera at appropriate distance
    const fov = cameraRef.current!.fov * (Math.PI / 180)
    const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.8 // 80% padding

    cameraRef.current!.position.set(0, 0, Math.max(distance, 5))
    cameraRef.current!.lookAt(0, 0, 0)

    // Set controls target to molecule center (origin after centering)
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
    }

    console.log(
      `Molecule rendered: ${data.atoms.length} atoms, ${data.bonds.length} bonds, max dimension: ${maxDim.toFixed(2)}`,
    )
  }

  // Initialize scene on mount
 useEffect(() => {
  initializeScene()

  const handleResize = () => {
    if (rendererRef.current && cameraRef.current && mountRef.current) {
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      rendererRef.current.setSize(width, height)
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      
      // Ensure canvas continues to fill container
      rendererRef.current.domElement.style.width = '100%'
      rendererRef.current.domElement.style.height = '100%'
    }
  }

  // Add ResizeObserver for more reliable container size detection
  let resizeObserver: ResizeObserver | null = null
  
  if (mountRef.current) {
    resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to debounce resize calls
      requestAnimationFrame(() => {
        handleResize()
      })
    })
    resizeObserver.observe(mountRef.current)
  }

  // Call initial resize to ensure proper sizing
  setTimeout(handleResize, 0)

  window.addEventListener("resize", handleResize)

  return () => {
    if (frameId.current) {
      cancelAnimationFrame(frameId.current)
    }
    
    // Cleanup resize observer
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    
    window.removeEventListener("resize", handleResize)

    // Cleanup Three.js objects
    if (controlsRef.current) {
      controlsRef.current.dispose()
    }
    if (rendererRef.current && mountRef.current) {
      const currentMount = mountRef.current
      if (currentMount && rendererRef.current.domElement) {
        currentMount.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current.dispose()
    }
  }
}, [])

  // Re-render molecule when data or labels change
  useEffect(() => {
  if (moleculeData) {
    renderMolecule(moleculeData)
  } else {
    clearScene()
  }
}, [moleculeData, showLabels])

  return (
    <div className="relative w-full h-full bg-[#f5f5f5] overflow-hidden">
      {/* Canvas container with max width constraint */}
      <div
        ref={mountRef}
        className="w-full h-full mx-auto relative overflow-hidden"
        style={{ minHeight: "400px" }} // Ensure minimum height
      />

      {/* Empty State */}
      {!moleculeData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center">
               <Image
                              src="/mox_logo.png"
                              alt="moleXa logo"
                              width={120}
                              height={120}
                              className="object-cover"
                              priority
                            />
            </div>
            <h2 className="text-3xl font-light text-gray-800 mb-4">Welcome to moleXa</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Explore molecular structures with high-quality 3D visualizations powered by PubChem data
            </p>
            <p className="text-sm text-gray-500">Select a molecule above or search below to get started</p>
          </div>
        </div>
      )}

      {/* Controls Info */}
      {moleculeData && (
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md rounded-xl p-4 border border-gray-200 shadow-lg max-w-xs">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <MousePointer2 className="h-4 w-4" />
            Controls
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center gap-2">
              <RotateCcw className="h-3 w-3" />
              Drag to rotate around molecule
            </p>
            <p className="flex items-center gap-2">
              <ZoomIn className="h-3 w-3" />
              Scroll to zoom in/out
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

Canvas3D.displayName = "Canvas3D"