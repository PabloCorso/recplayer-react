import React, { Component } from "react";
import controller from "recplayer";
import "./RecPlayer.css";
import PlayIcon from "./img/play.svg";
import PauseIcon from "./img/pause.svg";
import FullscreenIcon from "./img/fullscreen.svg";

class RecPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: props.autoPlay || false,
      fullscreen: false,
      maxFrames: 0
    };
  }
  componentWillReceiveProps(nextProps) {
    this.removeAnimationLoop();
    this.playerContainer.querySelector("canvas").remove();
    this.setState({
      playing: nextProps.autoPlay || false
    });
    this.initPlayer({
      levUrl: nextProps.levUrl,
      recUrl: nextProps.recUrl
    });
  }
  componentDidMount() {
    this._isMounted = true;
    this._progressBarDrag = false;
    window.addEventListener("resize", this.autoResize);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("mousemove", this.onMouseMove);
    this.initPlayer({
      levUrl: this.props.levUrl,
      recUrl: this.props.recUrl
    });
  }
  removeAnimationLoop = () => {
    if (this.cnt) {
      this.cnt.removeAnimationLoop();
    }
  };
  componentWillUnmount() {
    this._isMounted = false;
    window.removeEventListener("resize", this.autoResize);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.removeAnimationLoop();
  }
  frameCallback = (currentFrame, maxFrames) => {
    this._isMounted &&
      this.setState({
        maxFrames: maxFrames,
        progress: (currentFrame / maxFrames) * 100
      });
  };
  initPlayer = urls => {
    controller(
      urls.levUrl,
      this.props.imageUrl || "http://www.recsource.tv/images",
      this.playerContainer,
      document,
      this.frameCallback,
      this.props.autoPlay || false
    )(cnt => {
      this.cnt = cnt;
      this.autoResize();
      cnt.loadReplay(urls.recUrl);
      cnt.player().setScale(this.props.zoom || 0.8);
    });
  };
  autoResize = () => {
    if (this.cnt && this.playerContainer) {
      let w =
        ((this.props.width == "auto" || this.state.fullscreen) &&
          this.playerContainer.offsetWidth) ||
        this.props.width;
      let h =
        ((this.props.height == "auto" || this.state.fullscreen) &&
          this.playerContainer.offsetHeight) ||
        this.props.height;
      this.cnt.resize(w, h);
    }
  };
  playPause = () => {
    this.cnt.player().playPause();
    this.setState((prevState, props) => {
      return {
        playing: !prevState.playing
      };
    });
  };
  fullscreen = () => {
    this.setState((prevState, props) => {
      return {
        fullscreen: !prevState.fullscreen
      };
    }, this.autoResize);
  };
  goToFrame = frame => {
    this.cnt.setFrame(frame);
  };
  progressBarOnMouseDown = e => {
    this._progressBarDrag = true;
    this._wasPlaying = this.cnt.player().playing();
    if (this._wasPlaying) {
      this.playPause();
    }
    this.goToFrame(
      this.state.maxFrames *
        (e.nativeEvent.offsetX / e.currentTarget.offsetWidth)
    );
  };
  onMouseUp = () => {
    if (this._progressBarDrag && this._wasPlaying) {
      this.playPause();
    }
    this._progressBarDrag = false;
  };
  onMouseMove = e => {
    if (this._progressBarDrag && this._progressBar) {
      let pos =
        (e.pageX - this._progressBar.getBoundingClientRect().left) /
        this._progressBar.offsetWidth;
      if (pos < 0) pos = 0;
      else if (pos > 1) pos = 1;
      this.goToFrame(this.state.maxFrames * pos);
    }
  };
  render() {
    return (
      <div
        style={{
          height:
            this.props.height === "auto" ? "100%" : this.props.height + "px",
          width: this.props.width === "auto" ? "100%" : this.props.width + "px"
        }}
        className={
          this.state.fullscreen ? "RecPlayer RecPlayer-fullscreen" : "RecPlayer"
        }
      >
        <div
          className="RecPlayer-player-container"
          ref={element => {
            this.playerContainer = element;
          }}
        >
          {this.props.controls && (
            <div className="RecPlayer-controls">
              <div
                className="RecPlayer-controls-button"
                style={this.state.playing ? { display: "none" } : {}}
                onClick={this.playPause}
              >
                <img src={PlayIcon} />
              </div>
              <div
                className="RecPlayer-controls-button"
                style={!this.state.playing ? { display: "none" } : {}}
                onClick={this.playPause}
              >
                <img src={PauseIcon} />
              </div>
              <div
                className="RecPlayer-controls-button RecPlayer-controls-button-fullscreen"
                onClick={this.fullscreen}
              >
                <img src={FullscreenIcon} />
              </div>
              <div
                className="RecPlayer-controls-progress-bar"
                ref={el => (this._progressBar = el)}
                onMouseDown={e => this.progressBarOnMouseDown(e)}
              >
                <div className="RecPlayer-controls-progress-bar-background">
                  <div
                    style={{ width: this.state.progress + "%" }}
                    className="RecPlayer-controls-progress-bar-progress"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default RecPlayer;
