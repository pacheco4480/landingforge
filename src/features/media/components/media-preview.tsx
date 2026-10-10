import Image from "next/image";

export function MediaPreview({
  mimeType,
  publicUrl,
  filename,
}: {
  mimeType: string;
  publicUrl: string | null;
  filename: string;
}) {
  if (!publicUrl) {
    return (
      <div className="bg-muted grid aspect-video place-items-center text-sm">
        No preview
      </div>
    );
  }

  if (mimeType.startsWith("image/")) {
    return (
      <Image
        className="bg-muted aspect-video w-full rounded-md object-cover"
        alt={filename}
        height={360}
        src={publicUrl}
        style={{ height: "auto", width: "100%" }}
        unoptimized
        width={640}
      />
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <video
        className="bg-muted aspect-video w-full rounded-md"
        src={publicUrl}
        controls
        preload="metadata"
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <a
        className="bg-muted grid aspect-video place-items-center rounded-md text-sm font-semibold"
        href={publicUrl}
        target="_blank"
        rel="noreferrer"
      >
        Preview PDF
      </a>
    );
  }

  return (
    <div className="bg-muted grid aspect-video place-items-center text-sm">
      {mimeType}
    </div>
  );
}
