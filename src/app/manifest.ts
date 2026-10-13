import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduBridge — Exam Preparation",
    short_name: "EduBridge",
    description: "Prepare for JAMB UTME and WAEC with focused practice.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7faf8",
    theme_color: "#167a55",
  };
}
