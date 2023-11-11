# react-native-stack-view
Stack View for React Native without any libraries, it allows to show bottom/left/right sheet

# Screenshots
![img](https://i.imgur.com/k5vTfS8.png)
![img](https://i.imgur.com/CCCJBbw.png)

# Examples
```tsx
<StackView
    backgroundColor={isDarkMode ? themes.dark.stackBackgroundColor : themes.light.stackBackgroundColor}
    side={StackViewSide.Bottom}
    snapPoints={[25]}
    onClosed={() => {
        setTwoFaRequired(false);
    }}
>
    <Text
        style={{
            fontSize: 20,
            color: 'white',
        }}
    >Hello!</Text>
</StackView>
```
