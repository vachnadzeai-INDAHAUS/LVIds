import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type EffectOption = {
  id: string;
  label: string;
  effectId: string;
};

type PreviewImage = {
  id: string;
  src: string;
  alt: string;
};

type SliderProps = {
  effects: EffectOption[];
  previewImages: PreviewImage[];
  selectedId: string;
  selectedEffectId: string;
  onSelectEffect: (effectId: string) => void;
  className?: string;
};

export default function ModernSlider({
  effects,
  previewImages,
  selectedId,
  selectedEffectId,
  onSelectEffect,
  className
}: SliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [hoveredEffectId, setHoveredEffectId] = useState<string | null>(null);
  const [loadedPreviewIds, setLoadedPreviewIds] = useState<string[]>([]);
  const currentIndexRef = useRef(0);

  const safeImages = useMemo(
    () => previewImages.length ? previewImages : [{ id: 'empty', src: '', alt: '' }],
    [previewImages]
  );

  const effectiveEffectId = hoveredEffectId ?? selectedEffectId;
  const isLoading = loadedPreviewIds.length < safeImages.length && safeImages[0].src;

  // ძველი სლაიდერის transition/animation ლოგიკა ამოღებულია — ახალი preview იყენებს effect-* კლასებს
  const goTo = (index: number) => {
    setPrevIndex(currentIndex);
    const nextIndex = (index + safeImages.length) % safeImages.length;
    setCurrentIndex(nextIndex);
  };

  const handlePrev = () => goTo(currentIndex - 1);
  const handleNext = () => goTo(currentIndex + 1);
  const triggerPreviewTransition = useCallback(() => {
    if (safeImages.length < 2) {
      return;
    }
    const nextIndex = (currentIndexRef.current + 1) % safeImages.length;
    setPrevIndex(currentIndexRef.current);
    setCurrentIndex(nextIndex);
  }, [safeImages.length]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!hoveredEffectId) {
      return;
    }
    triggerPreviewTransition();
  }, [hoveredEffectId, triggerPreviewTransition]);

  return (
    <section className={className}>
      <div className="effect-slider" data-effect={effectiveEffectId}>
        <div className="effect-slider__viewport" role="region" aria-label="Slider preview">
          <div className="effect-slider__track">
            {safeImages.map((image, index) => {
              const isActive = index === currentIndex;
              const isPrev = prevIndex === index;
              return (
                <figure
                  key={image.id}
                  className={`effect-slider__slide${isActive ? ' is-active' : ''}${isPrev ? ' is-prev' : ''}`}
                  aria-hidden={!isActive}
                >
                  {image.src && (
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      decoding="async"
                      className="effect-slider__image"
                      onLoad={() => setLoadedPreviewIds(prev => prev.includes(image.id) ? prev : [...prev, image.id])}
                    />
                  )}
                </figure>
              );
            })}
          </div>

          {isLoading && (
            <div className="effect-slider__loading" aria-live="polite">
              Loading…
            </div>
          )}

          <button className="effect-slider__prev" onClick={handlePrev} type="button" aria-label="Previous slide">
            Prev
          </button>
          <button className="effect-slider__next" onClick={handleNext} type="button" aria-label="Next slide">
            Next
          </button>
        </div>

        <div className="effect-slider__effects" role="list">
          {effects.map(effect => (
            <button
              key={effect.id}
              type="button"
              role="listitem"
              className={`effect-slider__effect${selectedId === effect.id ? ' is-active' : ''}`}
              onMouseEnter={() => setHoveredEffectId(effect.effectId)}
              onMouseLeave={() => setHoveredEffectId(null)}
              onClick={() => {
                onSelectEffect(effect.id);
                triggerPreviewTransition();
              }}
              aria-pressed={selectedId === effect.id}
            >
              <span className="effect-slider__effect-label">{effect.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
