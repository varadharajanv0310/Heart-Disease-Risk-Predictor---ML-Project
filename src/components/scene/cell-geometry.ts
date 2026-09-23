import { DataTexture, LatheGeometry, LinearFilter, RGBAFormat, SRGBColorSpace, Vector2 } from 'three'

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

/**
 * Central pallor: the thin middle of a real red cell transmits more light, so
 * it looks paler (the classic microscope sign). Encoded as an emissive map
 * along the lathe's V coordinate, where ρ(v) = sin(πv) for this geometry.
 * Pale where ρ < ~0.45, fading out by ρ ≈ 0.75 — the dimple, not the rim.
 */
export function createPallorTexture(size = 256): DataTexture {
  const data = new Uint8Array(2 * size * 4)
  for (let j = 0; j < size; j++) {
    const v = j / (size - 1)
    const rho = Math.sin(Math.PI * v)
    const t = Math.min(1, Math.max(0, (0.75 - rho) / (0.75 - 0.3)))
    const pallor = Math.round(255 * t * t * (3 - 2 * t))
    for (let i = 0; i < 2; i++) {
      const k = (j * 2 + i) * 4
      data[k] = data[k + 1] = data[k + 2] = pallor
      data[k + 3] = 255
    }
  }
  const tex = new DataTexture(data, 2, size, RGBAFormat)
  tex.colorSpace = SRGBColorSpace
  tex.magFilter = LinearFilter
  tex.minFilter = LinearFilter
  tex.needsUpdate = true
  return tex
}
