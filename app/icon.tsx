import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Three-bar logomark — same as footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ width: 20, height: 3,  background: 'rgba(229,72,77,0.2)', borderRadius: 2 }} />
          <div style={{ width: 20, height: 6,  background: 'rgba(229,72,77,0.5)', borderRadius: 2 }} />
          <div style={{ width: 20, height: 12, background: '#e5484d',             borderRadius: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
