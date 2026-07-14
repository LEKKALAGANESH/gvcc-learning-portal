// Serializable shapes passed from server components to client components.
export type VideoDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  durationSec: number;
  category: string;
};

export type BookmarkDTO = {
  id: string;
  label: string | null;
  timeSec: number;
  videoId: string;
};

export type ProgressDTO = {
  videoId: string;
  positionSec: number;
  durationSec: number;
  completed: boolean;
};
