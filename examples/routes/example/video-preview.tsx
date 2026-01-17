import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Frame } from "./-frame";

export const Route = createFileRoute("/example/video-preview")({
  component: VideoPreview,
});

function VideoPreview() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Frame title="Video Preview" subtitle="Preview videos with transparency">
      <div
        className={`relative m-4 flex flex-1 items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          backgroundColor: "#3a3a3a",
          backgroundImage:
            "linear-gradient(45deg, #454545 25%, transparent 25%), linear-gradient(-45deg, #454545 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #454545 75%), linear-gradient(-45deg, transparent 75%, #454545 75%)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
        }}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="max-h-full max-w-full"
            style={{ background: "transparent" }}
          />
        ) : (
          <div className="bg-background/80 rounded-lg p-8 text-center backdrop-blur">
            <p className="text-muted-foreground text-lg">
              {isDragging ? "Drop video here" : "Drag and drop a video file"}
            </p>
          </div>
        )}
      </div>
    </Frame>
  );
}
