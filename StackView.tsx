import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { View, Animated, Dimensions } from "react-native";

// Enum for the side of the StackView
export enum StackViewSide {
    Left,
    Right,
    Bottom,
}

// Props for the StackView component
type StackViewProps = PropsWithChildren<{
    backgroundColor: string;
    side?: StackViewSide;
    style?: any;
    containerStyle?: any;
    snapPoints?: number[];
    onClosed?: () => void;
}>;

// Main StackView component
export default function StackView({
    children,
    backgroundColor,
    side = StackViewSide.Bottom,
    snapPoints = [100],
    onClosed = () => { },
    style,
    containerStyle,
}: StackViewProps): JSX.Element {
    // Animated value for the appearance animation
    const appearAnimation = useRef(new Animated.Value(0)).current;
    const [isHolding, setIsHolding] = useState(false);
    const velocity = useRef(0);
    const closeTimer = useRef<any>(null);
    const animationProgress = useRef(0);
    const maxStackPoint = Math.max(...snapPoints) / 100;

    // Effect for triggering the appearance animation
    useEffect(() => {
        Animated.timing(appearAnimation, {
            toValue: maxStackPoint,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Adding a listener to update the animation progress
        appearAnimation.addListener((event) => {
            animationProgress.current = event.value;
        });

        // Cleanup listener on unmount
        return () => appearAnimation.removeAllListeners();
    }, [appearAnimation]);

    // Function to trigger closing after a timeout
    const triggerCloseAfterTimeout = () => {
        closeTimer.current = setTimeout(onClosed, 1);
    };

    // Function to clear the closing timeout
    const clearCloseTimeout = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
        }
    };

    // Handle touch start event
    const handleTouchStart = (event: any) => {
        const x = Dimensions.get("window").width * (1 - animationProgress.current);
        const y = Dimensions.get("window").height * (1 - animationProgress.current);
        let isTouchInside = false;

        if (side === StackViewSide.Bottom) {
            isTouchInside =
                event.nativeEvent.pageY >= y - 14 && event.nativeEvent.pageY <= y + 36;
        } else if (side === StackViewSide.Right) {
            isTouchInside =
                event.nativeEvent.pageX >= x - 14 && event.nativeEvent.pageX <= x + 36;
        } else if (side === StackViewSide.Left) {
            isTouchInside =
                event.nativeEvent.pageX >= Dimensions.get("window").width - x - 36 &&
                event.nativeEvent.pageX <= Dimensions.get("window").width - x + 14;
        }

        setIsHolding(isTouchInside);
        if (isTouchInside) clearCloseTimeout();
    };

    // Handle touch end event
    const handleTouchEnd = (event: any) => {
        if (!isHolding) return;

        setIsHolding(false);

        const x = event.nativeEvent.pageX;
        const y = event.nativeEvent.pageY;
        const width = Dimensions.get("window").width;
        const height = Dimensions.get("window").height;
        let progress = 0;

        // Calculate progress based on the side
        if (side === StackViewSide.Bottom) {
            progress = (height - y) / height;
        } else if (side === StackViewSide.Right) {
            progress = (width - x) / width;
        } else if (side === StackViewSide.Left) {
            progress = x / width;
        }

        const invertedProgress = side === StackViewSide.Left ? -1 : 1;
        velocity.current *= invertedProgress;

        // Handle negative velocity
        if (velocity.current < 0) {
            if (velocity.current < -0.01) {
                let speed = -(velocity.current - (-0.01)) / 0.05;
                animateStackView(0, 300 / Math.max(speed, 1));
                triggerCloseAfterTimeout();
                return;
            }
        }
        // Handle positive velocity
        else if (velocity.current > 0) {
            if (velocity.current > 0.01) {
                let speed = (velocity.current - 0.01) / 0.05;

                animateStackView(maxStackPoint, 300 / Math.max(speed, 1));
                return;
            }
        }

        // Animate to the final progress
        const closestSnapPoint = [...snapPoints, 0].sort((a, b) => Math.abs(progress - a/100) - Math.abs(progress - b/100))[0];
        console.log(closestSnapPoint);
        animateStackView(closestSnapPoint / 100, 300);

        // Trigger closing if progress is less than 0.5
        if (closestSnapPoint === 0) {
            triggerCloseAfterTimeout();
        }
    };

    // Handle touch move event
    const handleTouch = (event: any) => {
        if (!isHolding) return;

        const x = event.nativeEvent.pageX;
        const y = event.nativeEvent.pageY;
        const width = Dimensions.get("window").width;
        const height = Dimensions.get("window").height;
        const progressX = (width - x) / width;
        const progressY = (height - y) / height;

        // Update velocity and animated value based on the side
        if (side === StackViewSide.Bottom) {
            velocity.current = progressY - animationProgress.current;
            appearAnimation.setValue(Math.min(progressY, maxStackPoint));
        } else if (side === StackViewSide.Right) {
            velocity.current = progressX - animationProgress.current; 
            appearAnimation.setValue(Math.min(progressX, maxStackPoint));
        } else if (side === StackViewSide.Left) {
            velocity.current = progressX - animationProgress.current;
            appearAnimation.setValue(Math.max(1 - progressX, 0)); 
        }
    };

    // Function to animate the StackView
    const animateStackView = (toValue: number, duration: number) => {
        Animated.timing(appearAnimation, {
            toValue: toValue,
            duration: duration,
            useNativeDriver: true,
        }).start();
    };

    // Calculate transform based on the side
    const transform = [];
    if (side === StackViewSide.Bottom) {
        transform.push({
            translateY: appearAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get("window").height, 0],
            }),
        });
    } else if (side === StackViewSide.Right || side === StackViewSide.Left) {
        transform.push({
            translateX: appearAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [
                    side === StackViewSide.Right
                        ? Dimensions.get("window").width
                        : -Dimensions.get("window").width,
                    0,
                ],
            }),
        });
    }

    // Main component JSX
    return (
        <View
            style={stackViewStyles.container}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouch}
        >
            <Animated.View
                style={{
                    ...stackViewStyles.animatedContainer,
                    backgroundColor: backgroundColor,
                    paddingRight: side === StackViewSide.Left ? 6 : 0,
                    paddingLeft: side === StackViewSide.Right ? 6 : 0,
                    paddingTop: side === StackViewSide.Bottom ? 6 : 0,
                    borderTopLeftRadius:
                        side === StackViewSide.Right || side === StackViewSide.Bottom
                            ? 16
                            : 0,
                    borderTopRightRadius:
                        side === StackViewSide.Left || side === StackViewSide.Bottom
                            ? 16
                            : 0,
                    borderBottomLeftRadius: side === StackViewSide.Right ? 16 : 0,
                    borderBottomRightRadius: side === StackViewSide.Left ? 16 : 0,
                    transform: transform,

                    top: 0,
                    bottom: (100 - maxStackPoint * 100) + '%',
                    
                    ...containerStyle,
                }}
            >
                <View style={{
                    ...stackViewStyles.innerContainer,
                    paddingTop: side === StackViewSide.Bottom ? 16 : 6,
                    paddingLeft: side === StackViewSide.Right ? 16 : 6,
                    paddingRight: side === StackViewSide.Left ? 16 : 6,
                    ...style
                }}>
                    {children}
                </View>
            </Animated.View>

            <Animated.View
                style={{
                    ...getIndicatorStyle(side),
                    transform: [
                        {
                            ...(side === StackViewSide.Bottom
                                ? {
                                    translateY: appearAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [Dimensions.get("window").height, 0],
                                    }),
                                }
                                : {
                                    translateX: appearAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [
                                            side === StackViewSide.Right
                                                ? Dimensions.get("window").width
                                                : -Dimensions.get("window").width,
                                            0,
                                        ],
                                    }),
                                }),
                        },
                    ],
                }}
            />
        </View>
    );
}

// Styles for the StackView component
const stackViewStyles: any = {
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    animatedContainer: {
        position: "absolute",
        left: 0,
        right: 0,
    },
    innerContainer: {
        flex: 1,
        flexDirection: "column",
        position: "absolute",
        alignContent: "center",
        justifyContent: "center",
    },
    bottomIndicator: {
        position: "absolute",
        left: "35%",
        right: "35%",
        top: 8,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#ccc",
    },
    rightIndicator: {
        position: "absolute",
        left: 8,
        top: "40%",
        bottom: "40%",
        width: 6,
        borderRadius: 3,
        backgroundColor: "#ccc",
    },
    leftIndicator: {
        position: "absolute",
        right: 8,
        top: "40%",
        bottom: "40%",
        width: 6,
        borderRadius: 3,
        backgroundColor: "#ccc",
    },
};

// Function to get the indicator style based on the side
const getIndicatorStyle = (side: StackViewSide) => {
    return side === StackViewSide.Bottom
        ? stackViewStyles.bottomIndicator
        : side === StackViewSide.Right
            ? stackViewStyles.rightIndicator
            : stackViewStyles.leftIndicator;
};
