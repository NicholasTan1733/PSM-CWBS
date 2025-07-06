import React from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Logo() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/items/logo.png")}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  image: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
});