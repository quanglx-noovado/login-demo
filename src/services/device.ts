import FingerprintJS from '@fingerprintjs/fingerprintjs'

export const DeviceService = {
  async getDeviceInfo() {
    // Lấy thông tin trình duyệt
    const userAgent = navigator.userAgent
    const browserName = this.getBrowserName()
    
    // Lấy fingerprint
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    const fingerprint = result.visitorId

    return {
      device_name: `${browserName} on ${navigator.platform}`,
      device_id: fingerprint,
      user_agent: userAgent
    }
  },

  getBrowserName() {
    const agent = navigator.userAgent
    switch (true) {
      case agent.indexOf("Edge") > -1: return "MS Edge"
      case agent.indexOf("Chrome") > -1: return "Chrome"
      case agent.indexOf("Firefox") > -1: return "Firefox"
      case agent.indexOf("Safari") > -1: return "Safari"
      default: return "Unknown"
    }
  }
} 