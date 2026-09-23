/**
 * Build target. The claude.ai artifact build runs in a sandboxed frame that
 * cannot print and whose URL can't be shared by QR, so it hides those two
 * features; everything else is identical to the site build.
 */
export const IS_ARTIFACT = process.env.NEXT_PUBLIC_FOCAL_TARGET === 'artifact'
