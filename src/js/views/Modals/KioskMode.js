import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from './Modal';
import Thumbnail from '../../components/Thumbnail';
import LinksSentence from '../../components/LinksSentence';
import Loader from '../../components/Loader';
import Icon from '../../components/Icon';
import ProgressSlider from '../../components/Fields/ProgressSlider';
import * as uiActions from '../../services/ui/actions';
import * as mopidyActions from '../../services/mopidy/actions';
import * as geniusActions from '../../services/genius/actions';
import { i18n, I18n } from '../../locale';
import { makeItemSelector, makeLoadingSelector } from '../../util/selectors';
import useTimer from '../../util/useTimer';

const LyricsScroller = ({
  content = '',
  percent = 0,
}) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const onWheel = () => setAutoScroll(false);

  useEffect(() => {
    if (autoScroll) {
      const height = (contentRef.current?.scrollHeight - containerRef.current?.clientHeight) || 0;
      containerRef.current.scrollTo(0, percent * height)
    }
  }, [percent]);

  return (
    <div ref={containerRef} className="lyrics" onWheel={onWheel}>
      <div
        ref={contentRef}
        className="lyrics__content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

const Lyrics = ({
  show_lyrics,
  playbackPosition = 0,
  current_track,
}) => {
  if (!show_lyrics) {
    return null;
  }
  const loadingSelector = makeLoadingSelector(['genius_(.*)']);
  const loading = useSelector(loadingSelector);
  const { lyrics, duration = 100 } = current_track || {};

  if (loading) {
    return (
      <div className="lyrics">
        <Loader body loading />
      </div>
    );
  }
  if (lyrics) {
    return (
      <LyricsScroller
        content={lyrics}
        percent={playbackPosition / duration}
      />
    );
  }
  return null;
};

const KioskMode = () => {
  const dispatch = useDispatch();
  const play_state = useSelector((state) => state.mopidy.play_state);
  const time_position = useSelector((state) => state.mopidy.time_position);
  const core_current_track = useSelector((state) => state.core.current_track);
  const itemSelector = makeItemSelector(core_current_track?.uri);
  const current_track = useSelector(itemSelector);
  const stream_title = useSelector((state) => state.core.stream_title);
  const genius_available = useSelector((state) => state.genius.authorization);
  const show_lyrics = useSelector((state) => state.ui.show_lyrics);
  const lyrics_enabled = show_lyrics && genius_available;
  const { images = [] } = current_track || {};
  const [playbackPosition, setPlaybackPosition] = useState(time_position);

  useTimer(
    () => {
      if (play_state === 'playing') setPlaybackPosition((prev) => prev + 1000);
    },
    1000,
    true,
  );

  useEffect(() => {
    setPlaybackPosition(time_position);
  }, [time_position]);

  const setWindowTitle = () => {
    if (stream_title) {
      const stream = stream_title.split(' - ');
      dispatch(uiActions.setWindowTitle(
        i18n('modal.kiosk.title_window', { name: stream[1], artist: stream[0] }),
      ));
    } else if (current_track) {
      const artist = current_track.artists.map((artist) => artist.name).join(', ');
      dispatch(uiActions.setWindowTitle(
        i18n('modal.kiosk.title_window', { name: current_track.name, artist })
      ));
    } else {
      dispatch(uiActions.setWindowTitle(i18n('modal.kiosk.title')));
    }
  };

  const fetchLyrics = () => {
    if (!show_lyrics || !genius_available) return;
    if (!current_track || !current_track?.artists?.length) return;
    if (current_track.lyrics) return;

    // We got results, but failed to load the lyrics, so re-try
    if (current_track?.lyrics_results && current_track.lyrics === null) {
      dispatch(geniusActions.getTrackLyrics(current_track.uri, current_track.path));
      return;
    }

    dispatch(geniusActions.findTrackLyrics(current_track.uri));
  };

  useEffect(() => {
    setWindowTitle();
  }, []);

  useEffect(() => {
    if (current_track) {
      setWindowTitle();
      fetchLyrics();
    }
  }, [current_track?.uri]);

  useEffect(() => {
    if (lyrics_enabled) {
      fetchLyrics();
    }
  }, [lyrics_enabled]);

  const toggleLyrics = () => {
    if (!genius_available) {
      uiActions.createNotification({
        level: 'warning',
        content: `${i18n('track.want_lyrics')} ${i18n('settings.title')}`,
      });
      return;
    }
    dispatch(uiActions.set({ show_lyrics: !show_lyrics }));
    fetchLyrics();
  };

  const extraControls = (
    <div className="control" onClick={toggleLyrics}>
      {lyrics_enabled ? <Icon name="toggle_on" className="turquoise-text" />
        : <Icon name="toggle_off" />}
      <div style={{ paddingLeft: '6px', fontWeight: 'bold' }}>
        <I18n path="modal.kiosk.lyrics" />
      </div>
    </div>
  );

  let playButton = (
    <button
      className="control play"
      type="button"
      onClick={() => dispatch(mopidyActions.play())}
    >
      <Icon name="play_circle_filled" type="material" />
    </button>
  );
  if (play_state === 'playing') {
    playButton = (
      <button
        className="control play"
        type="button"
        onClick={() => dispatch(mopidyActions.pause())}
      >
        <Icon name="pause_circle_filled" type="material" />
      </button>
    );
  }

  return (
    <Modal
      className="modal--kiosk-mode"
      extraControls={extraControls}
    >
      <Thumbnail className="background" images={images} placeholder={false} />

      <div className={`player player--${lyrics_enabled ? 'with' : 'without'}-lyrics`}>

        <div className="track">
          <div className="track__artwork">
            <Thumbnail images={images} useImageTag />
          </div>
          <div className="track__info">
            <div className="title">
              {stream_title && <span>{stream_title}</span>}
              {!stream_title && current_track && <span>{current_track.name}</span>}
              {!stream_title && !current_track && <span>-</span>}
            </div>
            <LinksSentence
              items={current_track ? current_track.artists : null}
              type="artist"
              nolinks
            />
          </div>
        </div>

        <div className="playback">
          <div className="playback__controls">
            <button
              className="control previous"
              onClick={() => dispatch(mopidyActions.previous())}
              type="button"
            >
              <Icon name="navigate_before" type="material" />
            </button>
            {playButton}
            <button
              className="control next"
              onClick={() => dispatch(mopidyActions.next())}
              type="button"
            >
              <Icon name="navigate_next" type="material" />
            </button>
          </div>
          <div className="playback__progress">
            <ProgressSlider playbackPosition={playbackPosition} />
          </div>
        </div>

      </div>

      <Lyrics
        show_lyrics={lyrics_enabled}
        genius_authorized={genius_available}
        playbackPosition={playbackPosition}
        current_track={current_track}
      />
    </Modal>
  );
};

export default KioskMode;
