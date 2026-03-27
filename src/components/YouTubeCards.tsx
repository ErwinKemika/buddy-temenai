import { Play, X } from "lucide-react";
import { useState } from "react";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

interface Props {
  videos: YouTubeVideo[];
}

const YouTubeCards = ({ videos }: Props) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!videos.length) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {videos.slice(0, 1).map((video) => {
        const isPlaying = playingId === video.videoId;
        const thumb = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

        return (
          <div
            key={video.videoId}
            className="bg-muted/30 border border-border/30 rounded-xl overflow-hidden max-w-[280px]"
          >
            {isPlaying ? (
              <div className="relative">
                <button
                  onClick={() => setPlayingId(null)}
                  className="absolute top-1.5 right-1.5 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X size={14} />
                </button>
                <iframe
                  src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                  width="100%"
                  style={{ aspectRatio: "16/9", border: 0 }}
                  allowFullScreen
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                />
              </div>
            ) : (
              <div
                className="cursor-pointer group"
                onClick={() => setPlayingId(video.videoId)}
              >
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={thumb}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                      <Play size={18} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="px-2.5 py-2">
              <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                {decodeHTMLEntities(video.title)}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {video.channelTitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export default YouTubeCards;
