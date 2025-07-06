import { useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
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
import { loginWithUserType } from '../../firebase/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const onLoginPressed = async () => {
    setGeneralError("");
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    setLoading(true);

    try {
      const result = await loginWithUserType(email.value, password.value);
      setLoading(false);

      const userType = result.userData.userType;

      if (userType === 'admin') {
        console.log('🔧 Routing to AdminDashboardScreen');
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminDashboardScreen' }],
        });
      } else {
        console.log('👤 Routing to HomeScreen (customer)');
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      }

    } catch (error) {
      setLoading(false);
      console.log("Login error:", error.code, error.message);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setGeneralError("Invalid email or password. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        setGeneralError("Too many failed login attempts. Please try again later.");
      } else {
        setGeneralError("Login failed. Please check your connection and try again.");
      }
    }
  };


  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <View style={styles.logoContainer}>
        <Logo />
      </View>
      <View style={styles.textContainer}>
        <Header>Welcome Back</Header>
      </View>
      
      {generalError ? <Text style={styles.errorText}>{generalError}</Text> : null}
      
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
        label="Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ResetPasswordScreen")}
        >
          <Text style={styles.forgot}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
      <Button
        mode="contained"
        onPress={onLoginPressed}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Login
      </Button>
      <View style={styles.row}>
        <Text style={styles.label}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace("RegisterScreen")}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  label: {
    color: theme.colors.secondary,
  },
  button: {
    marginTop: 24,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.error,
    paddingHorizontal: 4,
    paddingTop: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
});