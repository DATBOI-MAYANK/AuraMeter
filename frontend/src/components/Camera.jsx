import { useEffect, useRef, useState } from "react";

function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  let [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.log(error, "Access Denied");
      }
    };

    startCamera();
    // console.log(streamRef)
    return () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [capturedImage]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const maxWidth = 1024;

    const scale = Math.min(1, maxWidth / video.videoWidth);

    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setCapturedImage(blob);
       setImageUrl( URL.createObjectURL(blob));
 console.log(imageUrl);
      },
      "image/jpeg",
      0.8,
    );

     

   
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    video.srcObject = null;
  };

  return (
    <div>
      {!capturedImage ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted />

          <button onClick={capturePhoto}>Capture</button>
        </>
      ) : (
        <>
          <img src={imageUrl} alt="Captured" />

          <button onClick={() => setCapturedImage(null)}>Retake</button>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default Camera;
