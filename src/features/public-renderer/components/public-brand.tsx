"use client";

import Image from "next/image";
import { useState } from "react";

export function PublicBrand({
  altText,
  businessName,
  logoUrl,
}: {
  altText?: string | null;
  businessName: string;
  logoUrl?: string | null;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (!logoUrl || logoFailed) {
    return <span>{businessName}</span>;
  }

  return (
    <Image
      alt={altText ?? businessName}
      className="max-h-10 max-w-40 object-contain"
      height={40}
      onError={() => setLogoFailed(true)}
      src={logoUrl}
      style={{ height: "2.5rem", width: "auto" }}
      unoptimized
      width={160}
    />
  );
}
