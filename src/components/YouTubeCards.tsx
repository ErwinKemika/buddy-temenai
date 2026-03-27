import { ExternalLink, Play } from "lucide-react";

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
  if (!videos.length) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {videos.slice(0, 3).map((video) => (
        <a
          key={video.videoId}
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-2.5 bg-muted/30 hover:bg-muted/50 border border-border/30 rounded-xl p-2 transition-colors cursor-pointer group"
          style={{ touchAction: "manipulation", pointerEvents: "auto" }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(video.url, "_blank", "noopener,noreferrer");
          }}
        >
          {/* Thumbnail */}
          <div className="relative shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-muted/50">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play size={20} className="text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={18} className="text-white fill-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
              {decodeHTMLEntities(video.title)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
              {video.channelTitle}
              <ExternalLink size={10} className="shrink-0 opacity-50" />
            </p>
          </div>
        </a>
      ))}
    </div>
  );
};

function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export default YouTubeCards;
