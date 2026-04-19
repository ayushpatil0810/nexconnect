"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Eye,
  Smile,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Challenge = "blink" | "smile" | "turnHead";

interface ChallengeConfig {
  id: Challenge;
  label: string;
  instruction: string;
  icon: React.ElementType;
}

const CHALLENGES: ChallengeConfig[] = [
  {
    id: "blink",
    label: "Blink",
    instruction: "Please blink both eyes slowly",
    icon: Eye,
  },
  {
    id: "smile",
    label: "Smile",
    instruction: "Give us a nice smile 😊",
    icon: Smile,
  },
  {
    id: "turnHead",
    label: "Head Turn",
    instruction: "Turn your head slowly to either side",
    icon: RotateCcw,
  },
];

/* ------------------------------------------------------------------ */
/*  Thresholds                                                         */
/* ------------------------------------------------------------------ */

const BLINK_THRESHOLD = 0.35;
const SMILE_THRESHOLD = 0.45;
const HEAD_TURN_THRESHOLD = 0.12; // landmark-based yaw proxy

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface FaceLivenessCheckProps {
  onVerified: () => void;
}

export default function FaceLivenessCheck({
  onVerified,
}: FaceLivenessCheckProps) {
  /* ── state ─────────────────────────────────────────── */
  const [status, setStatus] = useState<
    "loading" | "camera-request" | "ready" | "verifying" | "done" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>(
    [],
  );
  const [challengePassed, setChallengePassed] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  /* ── refs ──────────────────────────────────────────── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const isProcessingRef = useRef(false);

  /* ── helpers ───────────────────────────────────────── */

  /** Get a blendshape score by name from the result */
  const getBlendshape = useCallback(
    (blendshapes: any[], name: string): number => {
      if (!blendshapes || blendshapes.length === 0) return 0;
      const categories = blendshapes[0]?.categories;
      if (!categories) return 0;
      const entry = categories.find(
        (c: any) => c.categoryName === name || c.displayName === name,
      );
      return entry?.score ?? 0;
    },
    [],
  );

  /** Compute a yaw proxy from face landmarks (nose tip vs. face edges) */
  const computeYawProxy = useCallback(
    (landmarks: any[]): number => {
      if (!landmarks || landmarks.length === 0) return 0;
      const pts = landmarks[0]; // first face
      if (!pts || pts.length < 400) return 0;
      // Nose tip (landmark 1), left cheek (landmark 234), right cheek (landmark 454)
      const noseTip = pts[1];
      const leftCheek = pts[234];
      const rightCheek = pts[454];
      if (!noseTip || !leftCheek || !rightCheek) return 0;

      const leftDist = Math.abs(noseTip.x - leftCheek.x);
      const rightDist = Math.abs(noseTip.x - rightCheek.x);
      const total = leftDist + rightDist;
      if (total === 0) return 0;
      // Ratio: 0.5 = centered, <0.5 = turned left, >0.5 = turned right
      const ratio = leftDist / total;
      return Math.abs(ratio - 0.5); // deviation from center
    },
    [],
  );

  /** Check if the current challenge is satisfied */
  const checkChallenge = useCallback(
    (result: any, challenge: Challenge): boolean => {
      const blendshapes = result.faceBlendshapes;
      const landmarks = result.faceLandmarks;

      switch (challenge) {
        case "blink": {
          const left = getBlendshape(blendshapes, "eyeBlinkLeft");
          const right = getBlendshape(blendshapes, "eyeBlinkRight");
          return left > BLINK_THRESHOLD && right > BLINK_THRESHOLD;
        }
        case "smile": {
          const left = getBlendshape(blendshapes, "mouthSmileLeft");
          const right = getBlendshape(blendshapes, "mouthSmileRight");
          return left > SMILE_THRESHOLD && right > SMILE_THRESHOLD;
        }
        case "turnHead": {
          const yaw = computeYawProxy(landmarks);
          return yaw > HEAD_TURN_THRESHOLD;
        }
        default:
          return false;
      }
    },
    [getBlendshape, computeYawProxy],
  );

  /* ── draw face overlay on canvas ───────────────────── */
  const drawOverlay = useCallback(
    (result: any, video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const landmarks = result.faceLandmarks;
      if (!landmarks || landmarks.length === 0) return;

      const pts = landmarks[0];
      // Draw face mesh dots
      ctx.fillStyle = "rgba(139, 92, 246, 0.45)"; // violet
      for (let i = 0; i < pts.length; i++) {
        const x = pts[i].x * canvas.width;
        const y = pts[i].y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw face contour line (jawline + forehead, simplified)
      const contourIndices = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
        379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
        234, 127, 162, 21, 54, 103, 67, 109, 10,
      ];
      ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < contourIndices.length; i++) {
        const idx = contourIndices[i];
        if (idx >= pts.length) continue;
        const x = pts[idx].x * canvas.width;
        const y = pts[idx].y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [],
  );

  /* ── detection loop ────────────────────────────────── */
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceLandmarker = faceLandmarkerRef.current;

    if (!video || !canvas || !faceLandmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const now = performance.now();
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;

      try {
        const result = faceLandmarker.detectForVideo(video, now);

        const hasFace =
          result.faceLandmarks && result.faceLandmarks.length > 0;
        setFaceDetected(hasFace);

        if (hasFace) {
          drawOverlay(result, video, canvas);

          // Only check challenge if we're verifying and haven't already passed the current one
          if (!isProcessingRef.current) {
            const currentChallenge = CHALLENGES[currentChallengeIdx];
            if (currentChallenge) {
              const passed = checkChallenge(result, currentChallenge.id);
              if (passed) {
                isProcessingRef.current = true;
                setChallengePassed(true);

                // Brief delay so user sees the check before moving on
                setTimeout(() => {
                  setCompletedChallenges((prev) => [
                    ...prev,
                    currentChallenge.id,
                  ]);
                  setChallengePassed(false);
                  isProcessingRef.current = false;

                  if (currentChallengeIdx >= CHALLENGES.length - 1) {
                    // All done!
                    setStatus("done");
                  } else {
                    setCurrentChallengeIdx((prev) => prev + 1);
                  }
                }, 900);
              }
            }
          }
        } else {
          // Clear canvas when no face
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch {
        // Ignore transient detection errors
      }
    }

    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, [currentChallengeIdx, drawOverlay, checkChallenge]);

  /* ── initialize MediaPipe + camera ─────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus("loading");

        // Dynamically import to avoid SSR issues
        const vision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        if (cancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false,
          },
        );

        if (cancelled) return;
        faceLandmarkerRef.current = landmarker;

        // Request camera
        setStatus("camera-request");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Wait for video element to be ready before attaching stream
        const waitForVideo = (): Promise<void> => {
          return new Promise((resolve) => {
            const check = () => {
              if (videoRef.current) {
                resolve();
              } else {
                requestAnimationFrame(check);
              }
            };
            check();
          });
        };

        await waitForVideo();
        if (cancelled) return;

        const video = videoRef.current!;
        video.srcObject = stream;

        // Wait for video to actually have data before transitioning
        await new Promise<void>((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          };
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.addEventListener("loadeddata", onReady);
          }
        });

        if (cancelled) return;

        try {
          await video.play();
        } catch {
          // autoPlay should handle it
        }

        setStatus("verifying");
      } catch (err: any) {
        if (cancelled) return;
        if (
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError"
        ) {
          setErrorMsg(
            "Camera access was denied. Please allow camera access and try again.",
          );
        } else if (
          err?.name === "NotFoundError" ||
          err?.name === "DevicesNotFoundError"
        ) {
          setErrorMsg(
            "No camera found. Please connect a camera and try again.",
          );
        } else {
          setErrorMsg(
            "Failed to initialize face verification. Please try again.",
          );
        }
        setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (faceLandmarkerRef.current) {
        try {
          faceLandmarkerRef.current.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  /* ── start detection loop when verifying ───────────── */
  useEffect(() => {
    if (status === "verifying") {
      animFrameRef.current = requestAnimationFrame(detectLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status, detectLoop]);

  /* ── call onVerified when done ─────────────────────── */
  useEffect(() => {
    if (status === "done") {
      // Stop camera
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const timer = setTimeout(() => {
        onVerified();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [status, onVerified]);

  /* ── retry handler ─────────────────────────────────── */
  function handleRetry() {
    setStatus("loading");
    setErrorMsg("");
    setCurrentChallengeIdx(0);
    setCompletedChallenges([]);
    setChallengePassed(false);
    setFaceDetected(false);
    isProcessingRef.current = false;
    lastVideoTimeRef.current = -1;

    // Re-trigger init
    window.location.reload();
  }

  /* ── render ────────────────────────────────────────── */

  const isLoading = status === "loading" || status === "camera-request";
  const isVerifying = status === "verifying";
  const isDone = status === "done";
  const isError = status === "error";

  const currentChallenge = CHALLENGES[currentChallengeIdx];
  const ChallengeIcon = currentChallenge?.icon ?? Eye;
  const progressPercent = (completedChallenges.length / CHALLENGES.length) * 100;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hidden video element — always in DOM so ref stays attached */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={isVerifying ? "hidden" : "hidden"}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
      />

      {/* ── Loading state ─────────────────────────────── */}
      {isLoading && (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Face Verification</h2>
            <p className="text-muted-foreground mt-1">
              {status === "loading"
                ? "Loading face detection model…"
                : "Requesting camera access…"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {status === "loading"
                  ? "Preparing AI model…"
                  : "Waiting for camera…"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Error state ───────────────────────────────── */}
      {isError && (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Face Verification</h2>
            <p className="text-muted-foreground mt-1">
              Something went wrong
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {errorMsg}
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRetry}
              id="liveness-retry-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </>
      )}

      {/* ── Done state ────────────────────────────────── */}
      {isDone && (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Verified! ✅</h2>
            <p className="text-muted-foreground mt-1">
              Your identity has been confirmed
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce-slow">
                <ShieldCheck className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-emerald-500/30 animate-ping" />
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              All challenges passed successfully
            </p>
            <div className="flex gap-2 mt-2">
              {CHALLENGES.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Active verification ────────────────────────── */}
      {isVerifying && (
        <>
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">Face Verification</h2>
            <p className="text-muted-foreground mt-1">
              Complete {CHALLENGES.length} quick checks to verify your identity
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Challenge {completedChallenges.length + 1} of {CHALLENGES.length}
              </span>
              <span className="font-medium text-primary">
                {Math.round(progressPercent)}% complete
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Challenge pills */}
          <div className="flex gap-2">
            {CHALLENGES.map((c, i) => {
              const done = completedChallenges.includes(c.id);
              const active = i === currentChallengeIdx && !challengePassed;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    done
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : active
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <c.icon className="w-3 h-3" />
                  )}
                  {c.label}
                </div>
              );
            })}
          </div>

          {/* Camera view */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] shadow-lg border border-border/50">
            {/* Visible video clone — draws from same stream */}
            <video
              ref={(el) => {
                // Mirror the hidden video's stream into this visible element
                if (el && streamRef.current && !el.srcObject) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-48 h-60 rounded-[50%] border-2 transition-all duration-500 ${
                  challengePassed
                    ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : faceDetected
                      ? "border-primary/60 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                      : "border-white/30 animate-pulse"
                }`}
              />
            </div>

            {/* Face not detected warning */}
            {!faceDetected && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Position your face in the oval
              </div>
            )}

            {/* Challenge passed flash */}
            {challengePassed && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 backdrop-blur-[1px] animate-fade-in">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                  <span className="text-emerald-500 font-semibold text-sm">
                    Challenge passed!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Current challenge instruction */}
          {!challengePassed && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ChallengeIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{currentChallenge?.label}</p>
                <p className="text-xs text-muted-foreground">
                  {currentChallenge?.instruction}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
