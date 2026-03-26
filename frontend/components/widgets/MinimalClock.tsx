import React, { useState, useEffect } from 'react';
import './MinimalClock.css';

const MinimalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  // 获取星期和日期
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdays[time.getDay()];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[time.getMonth()];
  const date = time.getDate();

  return (
    <div className="minimal-clock-widget">
      <div className="minimal-time">{hours}:{minutes}</div>
      <div className="minimal-date">
        <span className="weekday">{weekday}</span>
        <span className="separator">, </span>
        <span className="month">{month}</span>
        <span className="date-number">{date}</span>
      </div>
    </div>
  );
};

export default MinimalClock;
