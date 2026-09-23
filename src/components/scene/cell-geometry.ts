import { LatheGeometry, Vector2 } from 'three'

/**
 * Red blood cell geometry from the Evans–Fung biconcave profile
 * (Evans E, Fung YC. Microvasc Res 1972;4:335–347):
 *
 *   z(ρ) = ± ½ · √(1 − ρ²) · (C0 + C2·ρ² + C4·ρ⁴),   ρ = r / R
 *   C0 = 0.2072, C2 = 2.0026, C4 = −1.1228
 *
 * Revolved around the Y axis. Samples cluster near the rim (ρ = sin t) so the
 * torus-like edge stays smooth under clearcoat highlights.
 */
const C0 = 0.2072
const C2 = 2.0026
const C4 = -1.1228

export function halfThickness(rho: number): number {
  const r2 = rho * rho
  return 0.5 * Math.sqrt(Math.max(0, 1 - r2)) * (C0 + C2 * r2 + C4 * r2 * r2)
}

export function createCellGeometry(samples = 64, segments = 96, thickness = 1.25): LatheGeometry {
  const pts: Vector2[] = []
  // Top surface, centre → rim.
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * (Math.PI / 2)
    const rho = Math.sin(t)
    pts.push(new Vector2(Math.max(rho, 1e-4), halfThickness(rho) * thickness))
  }
  // Bottom surface, rim → centre.
  for (let i = samples - 1; i >= 0; i--) {
    const t = (i / samples) * (Math.PI / 2)
    const rho = Math.sin(t)
    pts.push(new Vector2(Math.max(rho, 1e-4), -halfThickness(rho) * thickness))
  }
  // Lathe expects the profile bottom → top for outward-facing normals.
  pts.reverse()
  const geo = new LatheGeometry(pts, segments)
  geo.computeVertexNormals()
  return geo
}
