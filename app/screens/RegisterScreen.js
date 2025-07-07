import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";

import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { nameValidator } from "../helpers/nameValidator";
import { phoneValidator } from "../helpers/phoneValidator";
import { signUp, createUserProfile } from '../../firebase/firebase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState({ value: "", error: "" });
  const [email, setEmail] = useState({ value: "", error: "" });
  const [phone, setPhone] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const onSignUpPressed = async () => {
    setGeneralError("");
    const nameError = nameValidator(name.value);
    const emailError = emailValidator(email.value);
    const phoneError = phoneValidator(phone.value);
    const passwordError = passwordValidator(password.value);
    
    if (emailError || passwordError || nameError || phoneError) {
      setName({ ...name, error: nameError });
      setEmail({ ...email, error: emailError });
      setPhone({ ...phone, error: phoneError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    setLoading(true);
    
    try {
      const userCredential = await signUp(email.value, password.value);
      await createUserProfile(userCredential.user.uid, {
        name: name.value,
        email: email.value,
        phone: phone.value,
        userType: 'customer',
      });
      
      setLoading(false);
      
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'LoginScreen',
          params: { registrationSuccess: true } 
        }],
      });
    } catch (error) {
      setLoading(false);
      console.error("Registration error:", error.code, error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        setEmail({ ...email, error: 'Email already in use' });
      } else if (error.code === 'auth/network-request-failed') {
        setGeneralError('Network error. Please check your connection.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Logo />
        </View>
        <Header>Create Account</Header>
        
        {generalError ? <Text style={styles.errorText}>{generalError}</Text> : null}
        
        <TextInput
          label="Full Name"
          returnKeyType="next"
          value={name.value}
          onChangeText={(text) => setName({ value: text, error: "" })}
          error={!!name.error}
          errorText={name.error}
          autoCompleteType="name"
          textContentType="name"
        />
        
        <TextInput
          label="Email"
          returnKeyType="next"
          value={email.value}
          onChangeText={(text) => setEmail({ value: text, error: "" })}
          error={!!email.error}
          errorText={email.error}
          autoCapitalize="none"
          autoCompleteType="email"
          textContentType="emailAddress"
          keyboardType="email-address"
        />
        
        <TextInput
          label="Phone Number"
          returnKeyType="next"
          value={phone.value}
          onChangeText={(text) => setPhone({ value: text, error: "" })}
          error={!!phone.error}
          errorText={phone.error}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoCompleteType="tel"
        />
        
        <TextInput
          label="Password"
          returnKeyType="done"
          value={password.value}
          onChangeText={(text) => setPassword({ value: text, error: "" })}
          error={!!password.error}
          errorText={password.error}
          secureTextEntry
        />
        
        <Text style={styles.passwordHint}>
          Password should contain at least 8 characters, one special character, and one uppercase letter.
        </Text>

        <Button
          mode="contained"
          onPress={onSignUpPressed}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Sign Up
        </Button>
        
        <View style={styles.row}>
          <Text style={styles.label}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace("LoginScreen")}>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.text,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  button: {
    marginTop: 15,
    width: '100%',
  },
  passwordHint: {
    fontSize: 13,
    color: theme.colors.secondary,
    paddingHorizontal: 5,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 30,
  }
});