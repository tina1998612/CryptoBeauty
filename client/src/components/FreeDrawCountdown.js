import React, { Component } from "react";
import PropTypes from 'prop-types';

class FreeDrawCountdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      now: Math.round(Date.now()/1000),
    }

    // Update now every 1 second.
    setInterval(() => {
      this.setState({ now: Math.round(Date.now()/1000) });
    }, 1000);
  }

  secToDHMS = (seconds) => {
    if (seconds >= 0) {
      let d = Math.floor(seconds / 86400);
      let h = Math.floor((seconds % 86400) / 3600);
      let m = Math.floor((seconds % 3600) / 60);
      let s = Math.floor(seconds % 60);
      return {d, h, m, s};
    }
    else {
      return {
        d: 0,
        h: 0,
        m: 0,
        s: 0
      }
    }
  };

  secToTimeStr = (seconds) => {
    if (seconds < 0) {
      return "Free";
    }

    const dhms = this.secToDHMS(seconds);
    let timeStr = (dhms.d > 0)?dhms.d.toString() + ' ' + this.props.daysStr + ' ' : '';

    timeStr = (timeStr
      + dhms.h.toString().padStart(2, '0') + ':'
      + dhms.m.toString().padStart(2, '0') + ':'
      + dhms.s.toString().padStart(2, '0'));

    return timeStr;
  };

  render() {
    const remainingTimeStr = this.secToTimeStr(this.props.endTime - this.state.now);

    return (
      <span>{remainingTimeStr}</span>
    );
  }
}

FreeDrawCountdown.propTypes = {
  endTime: PropTypes.number,
};

export default FreeDrawCountdown;