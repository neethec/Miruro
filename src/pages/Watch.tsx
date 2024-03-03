import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import EpisodeList from "../components/Watch/EpisodeList";
import VideoPlayer from "../components/Watch/Video/VideoPlayer";
import { fetchAnimeEpisodes, fetchAnimeInfo } from "../hooks/useApi";
import WatchSkeleton from "../components/Skeletons/WatchSkeleton";
import CardSkeleton from "../components/Skeletons/CardSkeleton"; // Import CardSkeleton

const LOCAL_STORAGE_KEYS = {
  LAST_WATCHED_EPISODE: "last-watched-",
};

const WatchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--global-primary-bg);
  color: var(--global-text);

  @media (min-width: 1200px) {
    margin-right: 2rem;
    margin-left: 2rem;
    flex-direction: row;
    align-items: flex-start;
  }
`;

const VideoPlayerContainer = styled.div`
  width: 100%;
  max-width: 600px;
  border-radius: var(--global-border-radius);
  margin-bottom: 1rem;

  @media (min-width: 1000px) {
    width: 70%;
    max-width: none;
    margin-bottom: 0;
    margin-right: 1rem;
  }
`;
const VideoPlayerImageWrapper = styled.div`
  border-radius: var(--global-border-radius); // Same radius as videplayer
  overflow: hidden; /* Add overflow property */
`;

const AnimeInfoContainer = styled.div`
  border-radius: var(--global-border-radius);
  margin-top: 0.8rem;
  padding: 0.6rem;
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (min-width: 1000px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const AnimeInfoImage = styled.img`
  border-radius: var(--global-border-radius);
  max-height: 120px;
  margin-right: 1rem;
  @media (min-width: 1000px) {
    max-height: 200px;
    margin-bottom: 0;
  }
`;

const AnimeInfoText = styled.div`
  text-align: left;
`;
const DescriptionText = styled.p`
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EpisodeListContainer = styled.div`
  width: 100%;
  overflow-y: auto; // Allows scrolling only when needed

  @media (min-width: 1000px) {
    aspect-ratio: 2 / 3;
    flex: 1 1 500px;
    max-height: 100%; // Ensures it doesn't exceed the parent's height
    overflow-y: auto; // Scroll if content overflows
  }
`;

interface Episode {
  id: string;
  number: number;
  title: string;
  image: string;
}

interface CurrentEpisode {
  id: string;
  number: number;
  image: string;
}

const Watch: React.FC = () => {
  const { animeId, animeTitle, episodeNumber } = useParams<{
    animeId: string;
    animeTitle?: string;
    episodeNumber?: string;
  }>();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<CurrentEpisode>({
    id: "0",
    number: 1,
    image: "",
  });
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEpisodeChanging, setIsEpisodeChanging] = useState(false);
  const [showNoEpisodesMessage, setShowNoEpisodesMessage] = useState(false);
  const [clickedEpisodes, setClickedEpisodes] = useState<string[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);

  const toggleTrailer = () => {
    setShowTrailer(!showTrailer);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!animeId) {
        console.error("Anime ID is null.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const info = await fetchAnimeInfo(animeId);
        setAnimeInfo(info);

        const animeData = await fetchAnimeEpisodes(animeId);
        if (animeData) {
          const transformedEpisodes = animeData.map((ep: Episode) => ({
            id: ep.id,
            number: ep.number,
            title: ep.title,
            image: ep.image,
          }));

          setEpisodes(transformedEpisodes);

          if (animeTitle && episodeNumber) {
            const episodeId = `${animeTitle}-episode-${episodeNumber}`;
            const matchingEpisode = transformedEpisodes.find(
              (ep: Episode) => ep.id === episodeId
            );
            if (matchingEpisode) {
              setCurrentEpisode({
                id: matchingEpisode.id,
                number: matchingEpisode.number,
                image: matchingEpisode.image,
              });
            } else {
              navigate(`/watch/${animeId}`);
            }
          } else {
            let savedEpisodeData = localStorage.getItem(
              LOCAL_STORAGE_KEYS.LAST_WATCHED_EPISODE + animeId
            );
            let savedEpisode = savedEpisodeData
              ? JSON.parse(savedEpisodeData)
              : null;

            if (savedEpisode && savedEpisode.number) {
              const animeTitle = savedEpisode.id.split("-episode")[0];
              navigate(
                `/watch/${animeId}/${animeTitle}/${savedEpisode.number}`,
                { replace: true }
              );
              setCurrentEpisode({
                id: savedEpisode.id || "",
                number: savedEpisode.number,
                image: "",
              });
            } else {
              const firstEpisode = transformedEpisodes[0];
              if (firstEpisode) {
                const animeTitle = firstEpisode.id.split("-episode")[0];
                navigate(
                  `/watch/${animeId}/${animeTitle}/${firstEpisode.number}`,
                  { replace: true }
                );
                setCurrentEpisode({
                  id: firstEpisode.id,
                  number: firstEpisode.number,
                  image: firstEpisode.image,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch anime info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [animeId, animeTitle, episodeNumber, navigate]);

  const handleEpisodeSelect = useCallback(
    async (selectedEpisode: Episode) => {
      setIsEpisodeChanging(true);

      const animeTitle = selectedEpisode.id.split("-episode")[0];

      setCurrentEpisode({
        id: selectedEpisode.id,
        number: selectedEpisode.number,
        image: selectedEpisode.image,
      });

      localStorage.setItem(
        LOCAL_STORAGE_KEYS.LAST_WATCHED_EPISODE + animeId,
        JSON.stringify({
          id: selectedEpisode.id,
          title: selectedEpisode.title,
          number: selectedEpisode.number,
        })
      );

      setClickedEpisodes((prevClickedEpisodes) => [
        ...prevClickedEpisodes,
        selectedEpisode.id,
      ]);

      navigate(`/watch/${animeId}/${animeTitle}/${selectedEpisode.number}`, {
        replace: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsEpisodeChanging(false);
    },
    [animeId, navigate]
  );

  useEffect(() => {
    if (animeInfo) {
      document.title = "Miruro - " + animeInfo.title.english;
    } else {
      document.title = "Miruro";
    }
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [animeInfo]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && (!episodes || episodes.length === 0)) {
        setShowNoEpisodesMessage(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [loading, episodes]);

  const removeHTMLTags = (description: string): string => {
    return description.replace(/<[^>]+>/g, "");
  };

  if (loading) {
    return (
      <WatchContainer>
        <CardSkeleton loading={loading} />{" "}
        {/* CardSkeleton for recommendations */}
        <WatchSkeleton />
      </WatchContainer>
    );
  }

  if (showNoEpisodesMessage) {
    return <div>No episodes found.</div>;
  }

  return (
    <WatchContainer>
      <VideoPlayerContainer>
        <VideoPlayerImageWrapper>
          <VideoPlayer
            episodeId={currentEpisode.id}
            bannerImage={animeInfo && animeInfo.cover}
            isEpisodeChanging={isEpisodeChanging}
          />
        </VideoPlayerImageWrapper>
        {animeInfo && (
          <AnimeInfoContainer>
            <AnimeInfoImage src={animeInfo.image} alt="Anime Title Image" />
            <AnimeInfoText>
              <h2>{animeInfo.title.english}</h2>
              <DescriptionText>
                <strong>Description: </strong>
                {removeHTMLTags(animeInfo.description)}
              </DescriptionText>
              <p>
                <strong>Genres: </strong> {animeInfo.genres.join(", ")}
              </p>
              <p>
                <strong>Released: </strong>{" "}
                {animeInfo.releaseDate ? animeInfo.releaseDate : "Unknown"}
              </p>
              <p>
                <strong>Status: </strong>
                {animeInfo.status}
              </p>
              <p>
                <strong>Rating: </strong>
                {animeInfo.rating}/100
              </p>
              {animeInfo.trailer && (
                <button
                  onClick={toggleTrailer}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "var(--primary-accent-bg)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--global-border-radius)",
                    cursor: "pointer",
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s ease",
                    outline: "none",
                  }}
                >
                  {showTrailer ? "Hide Trailer" : "Show Trailer"}
                </button>
              )}
              {showTrailer && (
                <div
                  style={{
                    overflow: "hidden",
                    paddingTop: "56.25%",
                    position: "relative",
                  }}
                >
                  <iframe
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                    src={`https://www.youtube.com/embed/${animeInfo.trailer.id}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </AnimeInfoText>
          </AnimeInfoContainer>
        )}
      </VideoPlayerContainer>
      <EpisodeListContainer>
        <EpisodeList
          episodes={episodes}
          selectedEpisodeId={currentEpisode.id}
          onEpisodeSelect={(episodeId: string) => {
            const episode = episodes.find((e) => e.id === episodeId);
            if (episode) {
              handleEpisodeSelect(episode);
            }
          }}
          clickedEpisodes={clickedEpisodes}
        />
      </EpisodeListContainer>
    </WatchContainer>
  );
};

export default Watch;
