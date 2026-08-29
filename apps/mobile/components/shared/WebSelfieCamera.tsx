import React, { useCallback, useEffect, useRef, useState } from "react";
import { THEME } from "@/constant/theme";

interface WebSelfieCameraProps {
  disabled?: boolean;
  captureLabel?: string;
  initialError?: string | null;
  initialStream?: MediaStream | null;
  onCancel: () => void;
  onCapture: (blob: Blob, dataUrl: string) => void | Promise<void>;
}

export function WebSelfieCamera({
  disabled = false,
  captureLabel = "Capture",
  initialError = null,
  initialStream = null,
  onCancel,
  onCapture,
}: WebSelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [ready, setReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this browser.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (cameraError) {
      console.error("Camera failed:", cameraError);
      setError("Allow camera access, then try again.");
    }
  }, [stopCamera]);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (!initialStream) return;
    streamRef.current = initialStream;
    setError(null);

    if (videoRef.current) {
      videoRef.current.srcObject = initialStream;
      videoRef.current.play().catch(() => undefined);
    }

    return stopCamera;
  }, [initialStream, stopCamera]);

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || disabled || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) return;

    await onCapture(blob, canvas.toDataURL("image/jpeg", 0.9));
  };

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.86)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        padding: 24,
      },
    },
    React.createElement("video", {
      ref: videoRef,
      autoPlay: true,
      playsInline: true,
      muted: true,
      onLoadedMetadata: () => setReady(true),
      style: {
        width: 300,
        height: 300,
        borderRadius: 150,
        objectFit: "cover",
        transform: "scaleX(-1)",
        background: "#111827",
        border: "4px solid rgba(255,255,255,0.14)",
      },
    }),
    error &&
      React.createElement(
        "div",
        {
          style: {
            color: "white",
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 300,
          },
        },
        error,
      ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" } },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: handleCancel,
          disabled,
          style: {
            border: 0,
            borderRadius: 12,
            padding: "12px 18px",
            background: "#374151",
            color: "white",
            fontWeight: 700,
          },
        },
        "Cancel",
      ),
      error &&
        React.createElement(
          "button",
          {
            type: "button",
            onClick: startCamera,
            disabled,
            style: {
              border: 0,
              borderRadius: 12,
              padding: "12px 18px",
              background: "#4b5563",
              color: "white",
              fontWeight: 700,
            },
          },
          "Try Again",
        ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: handleCapture,
          disabled: disabled || !ready,
          style: {
            border: 0,
            borderRadius: 12,
            padding: "12px 18px",
            background: ready ? THEME.accent : "#6b7280",
            color: "white",
            fontWeight: 700,
          },
        },
        disabled ? "Saving..." : ready ? captureLabel : "Starting...",
      ),
    ),
  );
}
