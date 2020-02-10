
import React from 'react';

import * as helpers from '../helpers';

export default class Parallax extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      url: null,
      outgoingUrl: null,
    };
  }

  componentDidMount() {
    if (this.props.image) {
      this.loadImage(this.props.image);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.image !== this.state.url) {
      this.loadImage(nextProps.image);
    }
  }

  loadImage(url) {
    if (url && url !== '') {
      this.setState({
        loaded: helpers.isCached(url),
        url,
      });

      const self = this;
      const imageObject = new Image();
      imageObject.src = url;

      imageObject.onload = function () {
        self.setState({
          loaded: true,
          url,
        });
      };

      // No Image, so reset it
    } else {
      this.setState({
        loaded: false,
        url: null,
      });
    }
  }

  render() {
    const {
      blur,
      fixedHeight,
      animate = true,
    } = this.props;
    const {
      loaded,
      url,
    } = this.state;

    let className = 'parallax preserve-3d';
    className += ` parallax--${fixedHeight ? 'fixed' : 'flexible'}-height`;
    if (blur) className += ' parallax--blur';
    if (loaded) className += ' parallax--loaded';
    if (animate) className += ' parallax--animate';

    const style = loaded && url ? { backgroundImage: `url("${url}")` } : {};

    return (
      <div className={className}>
        <div className="parallax__layer preserve-3d">
          <div className="parallax__image" style={style} />
          <div className="parallax__overlay" />
        </div>
      </div>
    );
  }
}
