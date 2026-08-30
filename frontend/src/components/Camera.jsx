import { useEffect, useRef, useState } from 'react'

function Camera() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const imageUrlRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [auraResult, setAuraResult] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (capturedImage) return undefined
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        setError('Camera access is required to begin the appraisal.')
      }
    }
    startCamera()
    return () => streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [capturedImage])

  useEffect(() => () => { if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current) }, [])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video?.videoWidth) return setError('The camera is still calibrating. Try again in a moment.')
    const scale = Math.min(1, 1024 / video.videoWidth)
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
      const nextUrl = URL.createObjectURL(blob)
      imageUrlRef.current = nextUrl
      setCapturedImage(blob)
      setImageUrl(nextUrl)
    }, 'image/jpeg', .85)
  }

  const scanAura = async () => {
    if (!capturedImage) return
    setError('')
    setIsScanning(true)
    const formData = new FormData()
    formData.append('image', capturedImage, 'capture.jpeg')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      setAuraResult(await res.json())
    } catch {
      setError('The appraisal system could not read that aura. Please try again.')
    } finally { setIsScanning(false) }
  }

  const handleRetake = () => { setCapturedImage(null); setAuraResult(null); setImageUrl(null); setError('') }
  const score = auraResult ? Math.round(auraResult.score) : null
  const rank = auraResult?.rank ?? '—'

  return <main className="aura-app">
    <section className="scouter-shell" aria-label="Aura scouter">
      <div className="system-mark"><i /> Aura Meter · System Interface</div>
      <div className="scouter-frame">
        <header className="card-header"><div><div className="card-kicker">Subject appraisal</div><div className="card-title">AURA SCOUTER</div></div><div className="card-id">UNIT 01<br />READY</div></header>
        <div className="capture-zone">
          {!capturedImage ? <><div className="videoBox"><video ref={videoRef} autoPlay playsInline muted /></div><div className="capture-guide">LOCK ON</div></> : <div className="preview-wrap"><img className="preview-image" src={imageUrl} alt="Captured subject for aura analysis" /></div>}
        </div>
        {auraResult && <article className="result-panel" style={{ '--rank-color': score >= 93 ? '#f0c4ff' : score >= 75 ? '#c98aff' : '#ab8bdb', '--rank-glow': score >= 93 ? 'rgba(217,132,255,.85)' : 'rgba(149,81,255,.7)' }}>
          <div className="rank-row"><div><div className="rank-label">Assigned rank</div><div className="rank-value"><span>{rank}</span></div></div><div className="card-id">CLASSIFIED<br />AURA DATA</div></div>
          <div className="power-row"><span className="power-icon">ϟ</span><span className="power-score">{score.toLocaleString()}</span></div><span className="field-label">Aura intensity / 100</span>
          <p className="quote">{auraResult.comment}</p>
        </article>}
        <div className={`command-row ${!capturedImage ? 'single' : ''}`}>
          {!capturedImage ? <button className="command-button primary" onClick={capturePhoto}>Capture subject</button> : <><button className="command-button" onClick={handleRetake}>Retake</button>{!auraResult && <button className="command-button primary" onClick={scanAura} disabled={isScanning}>{isScanning ? <span className="scan-copy"><i /> Scanning aura</span> : 'Analyze power'}</button>}</>}
        </div>
        {error && <p className="error-note">// {error}</p>}
      </div>
      <canvas ref={canvasRef} hidden />
    </section>
  </main>
}

export default Camera
