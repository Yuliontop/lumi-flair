import { FxCanvas, playSendEffect, HOLE_TIMING } from '../../src/effects'
import { CINEMATIC_CSS, blackHoleWarpRule } from '../../src/cinematic'
;(window as any).FxCanvas = FxCanvas; (window as any).playSendEffect = playSendEffect
;(window as any).HOLE = HOLE_TIMING; (window as any).CINE = CINEMATIC_CSS; (window as any).warpRule = blackHoleWarpRule
