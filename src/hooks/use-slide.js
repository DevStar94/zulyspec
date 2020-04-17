import React from 'react';

import { DeckContext } from './use-deck';
import debounce from '../utils/debounce';
import { AnimationMutexContext } from './useMutex';

/**
 * Performs logic operations for all of the slide domain level.
 * slideElements are dynamic elements within the slide that may
 * appear/ move around etc.
 * If remaining elements in slide, these are brought in one by one.
 * If not, we tell the deck to take us to the next slide.
 *
 * Note: Immediate is a React-Spring property that we pass to the animations
 * essentially it skips animations.
 */

// Initialise SlideContext.
export const SlideContext = React.createContext();

function useSlide(
  initialState,
  slideNum,
  slideElementsLength,
  keyboardControls
) {
  // Gets state, dispatch and number of slides off DeckContext.
  const [
    deckContextState,
    deckContextDispatch,
    ,
    ,
    animationsWhenGoingBack
  ] = React.useContext(DeckContext);

  const { synchronize } = React.useContext(AnimationMutexContext);
  const isActiveSlide = deckContextState.currentSlide === slideNum;

  const goToNextSlideElement = React.useCallback(() => {
    if (
      slideElementsLength === 0 ||
      deckContextState.currentSlideElement === slideElementsLength
    ) {
      synchronize(() => deckContextDispatch({ type: 'NEXT_SLIDE' }));
    } else {
      synchronize(() => deckContextDispatch({ type: 'NEXT_SLIDE_ELEMENT' }));
    }
  }, [
    deckContextDispatch,
    deckContextState.currentSlideElement,
    slideElementsLength,
    synchronize
  ]);

  const goToImmediateNextSlideElement = React.useCallback(() => {
    if (
      slideElementsLength === 0 ||
      deckContextState.currentSlideElement === slideElementsLength
    ) {
      synchronize(() => deckContextDispatch({ type: 'NEXT_SLIDE_IMMEDIATE' }));
    } else {
      synchronize(() =>
        deckContextDispatch({ type: 'NEXT_SLIDE_ELEMENT_IMMEDIATE' })
      );
    }
  }, [deckContextDispatch, deckContextState, slideElementsLength, synchronize]);

  const goToPreviousSlideElement = React.useCallback(() => {
    if (deckContextState.currentSlideElement === 0) {
      synchronize(() => deckContextDispatch({ type: 'PREV_SLIDE' }));
    } else {
      if (!animationsWhenGoingBack) {
        synchronize(() =>
          deckContextDispatch({ type: 'PREV_SLIDE_ELEMENT_IMMEDIATE' })
        );
        return;
      }
      synchronize(() => deckContextDispatch({ type: 'PREV_SLIDE_ELEMENT' }));
    }
  }, [
    animationsWhenGoingBack,
    deckContextDispatch,
    deckContextState,
    synchronize
  ]);

  // This useEffect adds a keyDown listener to the window.
  React.useEffect(
    function() {
      // Keep track of the number of next slide presses for debounce
      let nextSlidePress = 0;
      // Create ref for debounceing function
      const debouncedDispatch = debounce(() => {
        if (nextSlidePress === 1) {
          goToNextSlideElement();
        } else {
          goToImmediateNextSlideElement();
        }
        nextSlidePress = 0;
      }, 200);
      function handleKeyDown(e) {
        if (keyboardControls === 'arrows') {
          if (e.key === 'ArrowLeft') {
            goToPreviousSlideElement();
          }
          if (e.key === 'ArrowRight') {
            nextSlidePress++;
            debouncedDispatch();
          }
        }
        if (keyboardControls === 'space') {
          if (e.code === 'Space') {
            nextSlidePress++;
            debouncedDispatch();
            e.preventDefault();
          }
        }
      }
      isActiveSlide ? window.addEventListener('keydown', handleKeyDown) : null;
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    },
    [
      isActiveSlide,
      keyboardControls,
      goToNextSlideElement,
      goToPreviousSlideElement,
      goToImmediateNextSlideElement
    ]
  );
  return [
    {
      ...initialState,
      slideElementsLength,
      currentSlideElement: deckContextState.currentSlideElement,
      immediate: false,
      isActiveSlide
    },
    {
      goToNextSlideElement,
      goToImmediateNextSlideElement,
      goToPreviousSlideElement
    }
  ];
}

export default useSlide;
