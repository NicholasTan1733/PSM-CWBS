import React from "react";
import { StyleSheet, View } from "react-native";

import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import Paragraph from "../components/Paragraph";

export default function StartScreen({ navigation }) {
  return (
    <Background>
      <View style={styles.logoContainer}>
        <Logo />
      </View>
      <View style={styles.textContainer}>
        <Header>Swift Car Wash</Header>
        <Paragraph>
          Book your car wash service with ease, track appointments, and enjoy a hassle-free experience.
        </Paragraph>
      </View>

      <Button
        mode="contained"
        onPress={() => navigation.navigate("LoginScreen")}
      >
        Login
      </Button>
      
      <Button
        mode="outlined"
        onPress={() => navigation.navigate("RegisterScreen")}
      >
        Create Account
      </Button>
      

    </Background>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10, 
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  infoContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});