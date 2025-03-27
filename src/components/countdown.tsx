import React, { useState, useEffect } from 'react';

const CountdownTimer = () => {
    // Hard-coded target date (April 15, 2025)
    const targetDate = new Date('2025-03-30T23:59:00');

    const [timeRemaining, setTimeRemaining] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isReleased: false
    });

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date();
            const difference = targetDate - now;

            // Check if target date has passed
            if (difference <= 0) {
                setTimeRemaining({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isReleased: true
                });
                return true; // Signal to clear interval
            }

            // Calculate time units
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeRemaining({
                days,
                hours,
                minutes,
                seconds,
                isReleased: false
            });

            return false; // Continue interval
        };

        // Do initial calculation
        const isComplete = calculateTimeRemaining();

        // Only set up interval if not already released
        let interval;
        if (!isComplete) {
            interval = setInterval(() => {
                const shouldClearInterval = calculateTimeRemaining();
                if (shouldClearInterval) {
                    clearInterval(interval);
                }
            }, 1000);
        }

        // Cleanup interval on component unmount
        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    // Format the target date for display
    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

    return (
        <div className="flex flex-col items-center justify-center rounded-lg w-full max-w-md mt-10"
            style={{ fontFamily: 'Helius' }}
        >
            {/* <h2 className="text-2xl font-bold mb-4 text-indigo-700">Product Launch Countdown</h2> */}
            {timeRemaining.isReleased ? (
                <div className="text-3xl font-bold p-4 rounded-lg animate-pulse">
                    Beta Released!
                </div>
            ) : (
                <>

                    <div className="grid grid-cols-4 gap-4 w-full animate-pulse"
                        style={{ fontFamily: 'Helius' }}
                    >
                        <div className="flex flex-col items-center p-3  rounded-lg">
                            <div className="text-2xl font-bold text-indigo-100">{timeRemaining.days}</div>
                            <div className="text-xs text-gray-500">Days</div>
                        </div>
                        <div className="flex flex-col items-center p-3  rounded-lg">
                            <div className="text-2xl font-bold text-indigo-100">{timeRemaining.hours}</div>
                            <div className="text-xs text-gray-500">Hours</div>
                        </div>
                        <div className="flex flex-col items-center p-3  rounded-lg">
                            <div className="text-2xl font-bold text-indigo-100">{timeRemaining.minutes}</div>
                            <div className="text-xs text-gray-500">Minutes</div>
                        </div>
                        <div className="flex flex-col items-center p-3  rounded-lg">
                            <div className="text-2xl font-bold text-indigo-100">{timeRemaining.seconds}</div>
                            <div className="text-xs text-gray-500">Seconds</div>
                        </div>
                    </div>

                    {/* <div className="text-sm text-white mb-2"
                        style={{ textAlign: 'center' }}>
                        Days Left
                    </div> */}

                    <h2 className="text-white mb-4 text-lg font-medium"
                        style={{ textAlign: 'center' }}>
                        Beta Launch on {formatDate(targetDate)}
                    </h2>
                </>
            )}
        </div>
    );
};

export default CountdownTimer;