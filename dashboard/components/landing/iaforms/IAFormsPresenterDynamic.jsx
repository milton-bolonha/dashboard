import { useEffect, useMemo, useState } from "react";
import DynamicHeroSectionContainer from "@/components/landing/containers/DynamicHeroSectionContainer";
import DynamicHeroPresenter from "@/components/landing/hero/DynamicHeroPresenter";
import { useSSE } from "@/hooks/useSSE";

function StreamTiles({ jobId, getStreamUrl }) {
  const [tiles, setTiles] = useState([]);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    remaining: 0,
  });
  const listeners = useMemo(
    () => ({
      "job:status": (data) => {
        if (data?.progress?.total && tiles.length === 0) {
          const total = data.progress.total;
          setTiles(
            Array.from({ length: total }, (_v, i) => ({
              orderIndex: i,
              status: "loading",
              content: null,
            }))
          );
        }
        if (data?.progress) {
          setProgress({
            current: data.progress.current ?? 0,
            total: data.progress.total ?? tiles.length,
            remaining:
              data.progress.remaining ??
              Math.max(
                (data.progress.total ?? 0) - (data.progress.current ?? 0),
                0
              ),
          });
        }
      },
      "job:result-completed": (data) => {
        if (typeof data?.orderIndex === "number") {
          setTiles((prev) => {
            const next = prev.slice();
            next[data.orderIndex] = {
              orderIndex: data.orderIndex,
              status: "done",
              content: data.result,
            };
            return next;
          });
        }
      },
    }),
    [tiles.length]
  );
  const streamUrl =
    jobId && typeof getStreamUrl === "function" ? getStreamUrl() : null;
  useSSE(streamUrl, listeners);
  return (
    <>
      <div className="progress">
        <span>
          {progress.current}/{progress.total}
        </span>
        {typeof progress.remaining === "number" && (
          <span> • remaining: {progress.remaining}</span>
        )}
      </div>
      <div className="tiles-grid">
        {tiles.map((t) => (
          <div key={t.orderIndex} className={`tile ${t.status}`}>
            {t.status === "loading" ? "Generating Insights..." : t.content}
          </div>
        ))}
      </div>
    </>
  );
}

export default function IAFormsPresenterDynamic(props) {
  const { onRun, jobId, getStreamUrl, setItemsBuilder } = props;

  function ChildBridge(p) {
    useEffect(() => {
      if (typeof setItemsBuilder === "function") {
        setItemsBuilder(() => () => {
          const base = { ...p.inputs, themeId: p.selectedThemeId };
          // ⭐ CORREÇÃO: Template tem 8 tiles, não 6!
          return Array.from({ length: 8 }, (_v, i) => ({
            orderIndex: i,
            ...base,
          }));
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.inputs, p.selectedThemeId, setItemsBuilder]);

    return (
      <>
        <DynamicHeroPresenter
          {...p}
          handleFinalSubmit={async () => {
            await onRun?.();
          }}
        />
        <div className="max-w-4xl mx-auto px-4 pb-24">
          <StreamTiles jobId={jobId} getStreamUrl={getStreamUrl} />
        </div>
      </>
    );
  }

  return (
    <DynamicHeroSectionContainer mode="landing">
      {(p) => <ChildBridge {...p} />}
    </DynamicHeroSectionContainer>
  );
}
