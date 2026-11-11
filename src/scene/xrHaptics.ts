/**
 * WebXR Spatial Haptics Engine
 * Provides dual-actuator tactile feedback for VR controllers (Meta Quest, Apple Vision Pro, Vive)
 * Compliant with WebXR Gamepad API & W3C Haptics Spec.
 */

export type XRHapticProfile = 
  | 'subtle_tap'      // Hovering an affordance spline or grasping an entity
  | 'snap_connect'    // Promoting an emergent rule or closing a circuit
  | 'snap_release'    // Releasing an entity from magnetic snap
  | 'warning_shock'   // Triggering a cognitive error trap or invariant violation
  | 'quantum_chime'   // Completing a formal proof or adaptive cycle
  | 'impact_wood'     // Tactile wooden landing
  | 'impact_metal'    // Metallic strike vibration
  | 'impact_stone'    // Crisp stone / porcelain tap
  | 'chop_slice'      // Double chop tactile impact
  | 'teleport_dash'   // Spatial relocation pulse
  | 'snap_turn';      // Anti-nausea 45 deg snap turn tick

export class XRHapticsManager {
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isSupported = 'xr' in navigator;
    }
  }

  public get isXRAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Dispatch a tactile haptic pulse to all active WebXR controller gamepads
   */
  public triggerHaptic(profile: XRHapticProfile = 'subtle_tap'): void {
    // 1. Mobile & touch device vibration fallback
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (profile === 'subtle_tap' || profile === 'snap_turn') navigator.vibrate(15);
        else if (profile === 'snap_connect') navigator.vibrate(40);
        else if (profile === 'snap_release') navigator.vibrate(20);
        else if (profile === 'impact_wood') navigator.vibrate(30);
        else if (profile === 'impact_metal') navigator.vibrate([15, 20, 35]);
        else if (profile === 'impact_stone') navigator.vibrate(25);
        else if (profile === 'chop_slice') navigator.vibrate([25, 30, 25]);
        else if (profile === 'teleport_dash') navigator.vibrate(45);
        else if (profile === 'warning_shock') navigator.vibrate([60, 40, 60]);
        else if (profile === 'quantum_chime') navigator.vibrate([20, 30, 20]);
      } catch { /* ignore */ }
    }

    if (!this.isSupported || typeof navigator === 'undefined' || !navigator.xr) return;

    try {
      // Find gamepads associated with XR input sources
      const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      const xrGamepads = gamepads.filter(gp => gp && ((gp as any).hapticActuators?.length > 0 || (gp as any).vibrationActuator));

      if (xrGamepads.length === 0) return;

      xrGamepads.forEach(gp => {
        if (!gp) return;
        const actuator = (gp as any).hapticActuators?.[0] || (gp as any).vibrationActuator;
        if (!actuator || typeof actuator.pulse !== 'function') return;

        switch (profile) {
          case 'subtle_tap':
            actuator.pulse(0.2, 35);
            break;
          case 'snap_connect':
            actuator.pulse(0.65, 80);
            break;
          case 'snap_release':
            actuator.pulse(0.3, 30);
            break;
          case 'impact_wood':
            actuator.pulse(0.45, 55);
            break;
          case 'impact_metal':
            actuator.pulse(0.85, 25);
            setTimeout(() => {
              try { actuator.pulse(0.25, 45); } catch { /* ignore */ }
            }, 35);
            break;
          case 'impact_stone':
            actuator.pulse(0.7, 35);
            break;
          case 'chop_slice':
            actuator.pulse(0.75, 35);
            setTimeout(() => {
              try { actuator.pulse(0.5, 30); } catch { /* ignore */ }
            }, 60);
            break;
          case 'teleport_dash':
            actuator.pulse(0.4, 60);
            break;
          case 'snap_turn':
            actuator.pulse(0.25, 20);
            break;
          case 'warning_shock':
            actuator.pulse(1.0, 120);
            setTimeout(() => {
              try { actuator.pulse(0.8, 100); } catch { /* ignore */ }
            }, 160);
            break;
          case 'quantum_chime':
            actuator.pulse(0.4, 40);
            setTimeout(() => {
              try { actuator.pulse(0.3, 40); } catch { /* ignore */ }
            }, 100);
            setTimeout(() => {
              try { actuator.pulse(0.2, 50); } catch { /* ignore */ }
            }, 220);
            break;
        }
      });
    } catch {
      // Silently fall back if WebXR gamepads are unavailable
    }
  }
}

export const xrHaptics = new XRHapticsManager();
